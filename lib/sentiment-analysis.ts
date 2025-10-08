import {
  DetectSentimentCommand,
  DetectKeyPhrasesCommand,
  DetectEntitiesCommand,
  SentimentType,
  LanguageCode,
} from "@aws-sdk/client-comprehend";
import { comprehend } from "./aws";
import { logger } from "./logger";

/**
 * Sentiment analysis result interface
 */
export interface SentimentAnalysisResult {
  overall: SentimentType;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  keyPhrases: string[];
  entities?: Array<{
    text: string;
    type: string;
    sentiment?: SentimentType;
  }>;
  emotionalIntensity: number; // 0-1 scale, calculated from sentiment scores
  flags: string[]; // Warning flags for highly emotional/inflammatory content
}

/**
 * Analyze sentiment of text using AWS Comprehend
 * 
 * This function performs comprehensive sentiment analysis including:
 * - Overall sentiment detection (positive, negative, neutral, mixed)
 * - Sentiment confidence scores for each category
 * - Key phrase extraction
 * - Entity detection with sentiment
 * - Emotional intensity calculation
 * - Detection of inflammatory/manipulative language patterns
 * 
 * @param text - The text to analyze (max 5000 bytes for Comprehend)
 * @param languageCode - ISO 639-1 language code (default: "en")
 * @param requestId - Optional request ID for logging
 * @returns Promise<SentimentAnalysisResult | null>
 */
export async function analyzeSentiment(
  text: string,
  languageCode: string = "en",
  requestId?: string
): Promise<SentimentAnalysisResult | null> {
  if (!text || text.trim().length === 0) {
    logger.debug("No text provided for sentiment analysis", {
      requestId,
      operation: "sentiment-analysis",
    });
    return null;
  }

  // Truncate text if too long (Comprehend has 5000 byte limit per request)
  const maxBytes = 5000;
  let analyzableText = text;
  if (new TextEncoder().encode(text).length > maxBytes) {
    analyzableText = text.substring(0, 4000); // Safe truncation
    logger.debug("Text truncated for sentiment analysis", {
      requestId,
      operation: "sentiment-analysis",
      metadata: { originalLength: text.length, truncatedLength: analyzableText.length },
    });
  }

  try {
    logger.debug("Starting sentiment analysis", {
      requestId,
      operation: "sentiment-analysis",
      metadata: { textLength: analyzableText.length, languageCode },
    });

    // Normalize language code for Comprehend
    const languageCodeLower = languageCode.toLowerCase();
    let comprehendLanguage: LanguageCode = LanguageCode.EN; // Default to English
    
    // Map common language codes to Comprehend's LanguageCode enum
    switch (languageCodeLower) {
      case "en":
        comprehendLanguage = LanguageCode.EN;
        break;
      case "es":
        comprehendLanguage = LanguageCode.ES;
        break;
      case "fr":
        comprehendLanguage = LanguageCode.FR;
        break;
      case "de":
        comprehendLanguage = LanguageCode.DE;
        break;
      case "it":
        comprehendLanguage = LanguageCode.IT;
        break;
      case "pt":
        comprehendLanguage = LanguageCode.PT;
        break;
      case "ar":
        comprehendLanguage = LanguageCode.AR;
        break;
      case "hi":
        comprehendLanguage = LanguageCode.HI;
        break;
      case "ja":
        comprehendLanguage = LanguageCode.JA;
        break;
      case "ko":
        comprehendLanguage = LanguageCode.KO;
        break;
      case "zh":
      case "zh-cn":
        comprehendLanguage = LanguageCode.ZH;
        break;
      case "zh-tw":
        comprehendLanguage = LanguageCode.ZH_TW;
        break;
      default:
        logger.debug("Language not supported by Comprehend, using English", {
          requestId,
          operation: "sentiment-analysis",
          metadata: { originalLanguage: languageCode, fallbackLanguage: "en" },
        });
    }

    // Run sentiment analysis, key phrases, and entity detection in parallel
    const [sentimentResult, keyPhrasesResult, entitiesResult] = await Promise.allSettled([
      comprehend.send(
        new DetectSentimentCommand({
          Text: analyzableText,
          LanguageCode: comprehendLanguage,
        })
      ),
      comprehend.send(
        new DetectKeyPhrasesCommand({
          Text: analyzableText,
          LanguageCode: comprehendLanguage,
        })
      ),
      comprehend.send(
        new DetectEntitiesCommand({
          Text: analyzableText,
          LanguageCode: comprehendLanguage,
        })
      ),
    ]);

    // Extract sentiment data
    if (sentimentResult.status !== "fulfilled" || !sentimentResult.value.Sentiment) {
      logger.warn("Sentiment detection failed", {
        requestId,
        operation: "sentiment-analysis",
        metadata: {
          error: sentimentResult.status === "rejected" ? sentimentResult.reason : "No sentiment data",
        },
      });
      return null;
    }

    const sentiment = sentimentResult.value;
    const overall = sentiment.Sentiment as SentimentType;
    const scores = {
      positive: sentiment.SentimentScore?.Positive || 0,
      negative: sentiment.SentimentScore?.Negative || 0,
      neutral: sentiment.SentimentScore?.Neutral || 0,
      mixed: sentiment.SentimentScore?.Mixed || 0,
    };

    // Extract key phrases
    const keyPhrases =
      keyPhrasesResult.status === "fulfilled"
        ? (keyPhrasesResult.value.KeyPhrases || [])
            .filter((kp) => kp.Score && kp.Score > 0.8) // High confidence phrases only
            .map((kp) => kp.Text || "")
            .filter((text) => text.length > 0)
            .slice(0, 10) // Top 10 key phrases
        : [];

    // Extract entities with their types
    const entities =
      entitiesResult.status === "fulfilled"
        ? (entitiesResult.value.Entities || [])
            .filter((e) => e.Score && e.Score > 0.7) // High confidence entities only
            .map((e) => ({
              text: e.Text || "",
              type: e.Type || "UNKNOWN",
            }))
            .filter((e) => e.text.length > 0)
            .slice(0, 15) // Top 15 entities
        : [];

    // Calculate emotional intensity (how strongly emotional the content is)
    // High negative or positive scores indicate emotional content
    const emotionalIntensity = Math.max(
      scores.positive,
      scores.negative,
      scores.mixed * 0.8 // Mixed sentiment also indicates emotional content
    );

    // Detect inflammatory/manipulative content flags
    const flags: string[] = [];

    // Very high negative sentiment (potential fear-mongering, anger)
    if (scores.negative > 0.7) {
      flags.push("high_negative_sentiment");
    }

    // High emotional intensity with mixed sentiment (potential manipulation)
    if (emotionalIntensity > 0.8 && scores.mixed > 0.3) {
      flags.push("emotionally_manipulative");
    }

    // Check for inflammatory key phrases
    const inflammatoryKeywords = [
      "shocking",
      "outrageous",
      "scandal",
      "exposed",
      "truth they don't want",
      "wake up",
      "sheeple",
      "fake news",
      "mainstream media",
      "cover up",
      "conspiracy",
    ];
    const hasInflammatoryLanguage = keyPhrases.some((phrase) =>
      inflammatoryKeywords.some((keyword) =>
        phrase.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    if (hasInflammatoryLanguage) {
      flags.push("inflammatory_language");
    }

    // Very high positive sentiment can also be suspicious (clickbait, too good to be true)
    if (scores.positive > 0.85 && emotionalIntensity > 0.85) {
      flags.push("suspiciously_positive");
    }

    const result: SentimentAnalysisResult = {
      overall,
      scores,
      keyPhrases,
      entities: entities.length > 0 ? entities : undefined,
      emotionalIntensity,
      flags,
    };

    logger.info("Sentiment analysis completed", {
      requestId,
      operation: "sentiment-analysis",
      metadata: {
        overall,
        emotionalIntensity,
        flagsCount: flags.length,
        keyPhrasesCount: keyPhrases.length,
        entitiesCount: entities.length,
      },
    });

    return result;
  } catch (error) {
    logger.error(
      "Sentiment analysis failed",
      {
        requestId,
        operation: "sentiment-analysis",
        metadata: {
          textLength: analyzableText.length,
          languageCode,
        },
      },
      error as Error
    );

    // Return null on error - sentiment is optional, don't fail the entire analysis
    return null;
  }
}

/**
 * Calculate a sentiment-based credibility modifier
 * 
 * Returns a multiplier (0.8 - 1.0) based on sentiment analysis
 * Highly emotional/inflammatory content gets a lower multiplier
 * 
 * @param sentiment - Sentiment analysis result
 * @returns number - Credibility modifier (0.8 - 1.0)
 */
export function calculateSentimentCredibilityModifier(
  sentiment: SentimentAnalysisResult | null
): number {
  if (!sentiment) return 1.0; // No sentiment data, no modification

  let modifier = 1.0;

  // Reduce credibility for highly emotional content
  if (sentiment.emotionalIntensity > 0.8) {
    modifier -= 0.1;
  }

  // Reduce credibility for inflammatory language
  if (sentiment.flags.includes("inflammatory_language")) {
    modifier -= 0.1;
  }

  // Reduce credibility for emotionally manipulative content
  if (sentiment.flags.includes("emotionally_manipulative")) {
    modifier -= 0.15;
  }

  // Slight reduction for suspiciously positive (clickbait)
  if (sentiment.flags.includes("suspiciously_positive")) {
    modifier -= 0.05;
  }

  // Ensure modifier stays within reasonable bounds
  return Math.max(0.8, Math.min(1.0, modifier));
}

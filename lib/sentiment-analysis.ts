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
  manipulationTactics?: Array<{
    tactic: string;
    description: string;
    examples: string[];
  }>;
  credibilityImpact?: {
    modifier: number;
    explanation: string;
  };
  targetEmotions?: string[];
  linguisticRedFlags?: Array<{
    type: string;
    phrase: string;
    reason: string;
  }>;
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
    const manipulationTactics: Array<{
      tactic: string;
      description: string;
      examples: string[];
    }> = [];
    const targetEmotions: string[] = [];
    const linguisticRedFlags: Array<{
      type: string;
      phrase: string;
      reason: string;
    }> = [];

    // Very high negative sentiment (potential fear-mongering, anger)
    if (scores.negative > 0.7) {
      flags.push("high_negative_sentiment");
      targetEmotions.push("fear", "anger");
      manipulationTactics.push({
        tactic: "Fear-mongering",
        description: "Uses highly negative language to provoke fear or anxiety responses",
        examples: keyPhrases.slice(0, 3),
      });
    }

    // High emotional intensity with mixed sentiment (potential manipulation)
    if (emotionalIntensity > 0.8 && scores.mixed > 0.3) {
      flags.push("emotionally_manipulative");
      targetEmotions.push("confusion", "urgency");
      manipulationTactics.push({
        tactic: "Emotional Manipulation",
        description: "Combines conflicting emotions to bypass critical thinking",
        examples: keyPhrases.slice(0, 3),
      });
    }

    // Enhanced linguistic red flag detection
    const textLower = analyzableText.toLowerCase();
    
    // Absolutist language
    const absolutistPatterns = [
      { pattern: /\b(always|never|everyone|nobody|all|none)\b/g, type: "absolutist" },
    ];
    
    // Tribal/us-vs-them language
    const tribalPatterns = [
      { pattern: /\b(they don't want you to know|wake up|sheeple|mainstream media lies)\b/g, type: "tribal" },
      { pattern: /\b(us vs them|elite|globalist)\b/g, type: "tribal" },
    ];
    
    // Emotional amplifiers
    const amplifierPatterns = [
      { pattern: /\b(shocking|horrifying|unbelievable|devastating|explosive)\b/g, type: "amplifier" },
      { pattern: /\b(breaking|urgent|act now|must see|revealed)\b/g, type: "amplifier" },
    ];
    
    // Vague attributions
    const vaguePatterns = [
      { pattern: /\b(sources say|people are saying|many believe|it is reported)\b/g, type: "vague_attribution" },
    ];

    // Check for inflammatory key phrases
    const inflammatoryKeywords = [
      "shocking", "outrageous", "scandal", "exposed", "truth they don't want",
      "wake up", "sheeple", "fake news", "mainstream media", "cover up", "conspiracy",
      "bombshell", "stunning", "unbelievable", "devastating", "explosive",
    ];
    
    const foundInflammatoryPhrases = keyPhrases.filter((phrase) =>
      inflammatoryKeywords.some((keyword) =>
        phrase.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (foundInflammatoryPhrases.length > 0) {
      flags.push("inflammatory_language");
      targetEmotions.push("outrage", "shock");
      manipulationTactics.push({
        tactic: "Inflammatory Language",
        description: "Uses provocative words designed to trigger emotional reactions rather than inform",
        examples: foundInflammatoryPhrases.slice(0, 3),
      });
      
      foundInflammatoryPhrases.forEach(phrase => {
        linguisticRedFlags.push({
          type: "inflammatory",
          phrase,
          reason: "Designed to provoke emotional reactions rather than inform",
        });
      });
    }

    // Detect absolutist language in key phrases
    keyPhrases.forEach(phrase => {
      if (/\b(always|never|everyone|nobody|all|none)\b/i.test(phrase)) {
        linguisticRedFlags.push({
          type: "absolutist",
          phrase,
          reason: "Absolute statements are rarely accurate and often indicate exaggeration",
        });
      }
      
      if (/\b(sources say|people are saying|many believe)\b/i.test(phrase)) {
        linguisticRedFlags.push({
          type: "vague_attribution",
          phrase,
          reason: "Vague attributions avoid providing verifiable sources",
        });
      }
    });

    // Detect urgency tactics
    if (/\b(urgent|act now|hurry|don't wait|last chance|breaking)\b/i.test(textLower)) {
      manipulationTactics.push({
        tactic: "Urgency Tactics",
        description: "Creates false sense of urgency to prevent careful evaluation",
        examples: keyPhrases.filter(p => /urgent|act now|hurry|breaking/i.test(p)).slice(0, 2),
      });
      targetEmotions.push("urgency", "anxiety");
    }

    // Very high positive sentiment can also be suspicious (clickbait, too good to be true)
    if (scores.positive > 0.85 && emotionalIntensity > 0.85) {
      flags.push("suspiciously_positive");
      targetEmotions.push("hope", "excitement");
      manipulationTactics.push({
        tactic: "Too Good to Be True",
        description: "Unusually high positive sentiment may indicate clickbait or unrealistic promises",
        examples: keyPhrases.slice(0, 3),
      });
    }

    // Calculate credibility impact
    let credibilityModifier = 1.0;
    const impactReasons: string[] = [];

    if (emotionalIntensity > 0.8) {
      credibilityModifier -= 0.1;
      impactReasons.push("High emotional intensity suggests potential bias");
    }

    if (flags.includes("inflammatory_language")) {
      credibilityModifier -= 0.1;
      impactReasons.push("Inflammatory language often indicates manipulation");
    }

    if (flags.includes("emotionally_manipulative")) {
      credibilityModifier -= 0.15;
      impactReasons.push("Emotional manipulation tactics detected");
    }

    if (linguisticRedFlags.length >= 3) {
      credibilityModifier -= 0.05;
      impactReasons.push("Multiple linguistic red flags present");
    }

    credibilityModifier = Math.max(0.7, Math.min(1.0, credibilityModifier));

    const result: SentimentAnalysisResult = {
      overall,
      scores,
      keyPhrases,
      entities: entities.length > 0 ? entities : undefined,
      emotionalIntensity,
      flags,
      manipulationTactics: manipulationTactics.length > 0 ? manipulationTactics : undefined,
      credibilityImpact: credibilityModifier < 1.0 ? {
        modifier: credibilityModifier,
        explanation: impactReasons.join(". "),
      } : undefined,
      targetEmotions: targetEmotions.length > 0 ? [...new Set(targetEmotions)] : undefined,
      linguisticRedFlags: linguisticRedFlags.length > 0 ? linguisticRedFlags.slice(0, 10) : undefined,
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
        manipulationTacticsCount: manipulationTactics.length,
        redFlagsCount: linguisticRedFlags.length,
        credibilityModifier,
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

import {
  BaseHandler,
  ProcessingContext,
  ExtractedContent,
  TranscriptionResult,
  FactCheckResult,
} from "./base-handler";
import { ApiError } from "../../../../lib/api-error";
import { scrapeWebContent } from "../../../../tools/helpers";
import { getCreator } from "../../../../lib/db/repo";
import { researchAndFactCheck } from "../../../../tools/fact-checking";
import { analyzePoliticalBias } from "../../../../tools/fact-checking/political-bias-analysis";
import { calculateCreatorCredibilityRating } from "../../../../tools/content-analysis";
import { logger } from "../../../../lib/logger";
import { analyzeSentiment } from "../../../../lib/sentiment-analysis";

/**
 * Web content-specific data extracted from the platform
 */
interface WebExtractedData extends ExtractedContent {
  content: string;
  author?: string;
  metadata?: {
    publishedTime?: string;
    modifiedTime?: string;
    keywords?: string;
    language?: string;
  };
  type: "web_content";
}

/**
 * Web content handler
 *
 * Handles the complete processing pipeline for web articles and blog posts:
 * 1. Extract article content and metadata using web scraping
 * 2. Skip transcription (no video content expected)
 * 3. Fact-check the article content
 * 4. Calculate creator/source credibility rating
 *
 * @example
 * ```typescript
 * const handler = new WebHandler();
 * const result = await handler.process(webUrl, context);
 * ```
 */
export class WebHandler extends BaseHandler {
  constructor() {
    super("web");
  }

  /**
   * Extract web content and metadata using web scraping
   * @param url - Web article/blog URL
   * @param context - Processing context
   * @returns Extracted web content data
   * @throws ApiError if extraction fails
   */
  protected async extractContent(
    url: string,
    context: ProcessingContext
  ): Promise<ExtractedContent | null> {
    logger.debug("Extracting web content", {
      requestId: context.requestId,
      platform: this.platform,
      operation: "extract-content",
      metadata: { url },
    });

    try {
      const scrapeResult = await scrapeWebContent(url);

      if (!scrapeResult.success || !scrapeResult.data) {
        throw ApiError.webScrapeFailed(
          url,
          new Error(
            scrapeResult.error || "Web scraping returned unsuccessful status"
          )
        );
      }

      const data = scrapeResult.data;

      const extractedData: WebExtractedData = {
        title: data.title || "Web Content",
        description: data.description || data.title || "",
        creator: data.author || "Unknown",
        content: data.content || "",
        author: data.author,
        metadata: data.metadata,
        type: "web_content",
      };

      return extractedData;
    } catch (error) {
      logger.error(
        "Web content extraction failed",
        {
          requestId: context.requestId,
          platform: this.platform,
          operation: "extract-content",
          metadata: { url },
        },
        error as Error
      );

      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.webScrapeFailed(url, error as Error);
    }
  }

  /**
   * Web content doesn't typically have video, so transcription is skipped
   * @param extractedData - Data extracted from web
   * @param context - Processing context
   * @returns Always null for web content
   */
  protected async transcribeContent(
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<TranscriptionResult | null> {
    logger.debug("Skipping transcription for web content", {
      requestId: context.requestId,
      platform: this.platform,
      operation: "transcribe-content",
      metadata: { contentType: "web_content" },
    });

    // Web content doesn't have video to transcribe
    return null;
  }

  /**
   * Fact-check the web article content
   * @param transcription - Always null for web content
   * @param extractedData - Original web content data
   * @param context - Processing context
   * @returns Fact-check result or null if no content to check
   */
  protected async performFactCheck(
    transcription: TranscriptionResult | null,
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<FactCheckResult | null> {
    if (!extractedData) {
      return null;
    }

    const webData = extractedData as WebExtractedData;
    const textToFactCheck = webData.content || webData.description;

    if (!textToFactCheck || textToFactCheck.trim().length === 0) {
      logger.debug("No content available for fact-checking", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "fact-check",
        metadata: {
          hasContent: !!webData.content,
          hasDescription: !!webData.description,
        },
      });
      return null;
    }

    try {
      logger.debug("Starting fact-check process", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "fact-check",
        metadata: {
          contentLength: textToFactCheck.length,
          author: webData.creator,
          title: webData.title,
        },
      });

      const contextPrompt = `Web Content Analysis Context:
- Source: ${webData.creator}
- Article Title: "${webData.title}"
- Article Content: "${webData.description}"
- Article URL: ${context.url}
- Platform: Web Article/Blog
- Publication Date: ${webData.metadata?.publishedTime || "Unknown"}
- Language: ${webData.metadata?.language || "Unknown"}

Please fact-check the claims from this web article content, paying special attention to the article content and any factual claims made. Consider the context that this is web content that may contain opinions, analysis, or claims that need verification.`;

      const factCheck = await researchAndFactCheck.execute(
        {
          transcription: textToFactCheck,
          title: webData.title,
          context: contextPrompt,
        },
        {
          toolCallId: "web-verification",
          messages: [],
        }
      );

      if (factCheck.success && factCheck.data) {
        interface FactCheckData {
          overallStatus?: string;
          confidence?: number;
          reasoning?: string;
          sources?: Array<{ url: string; title: string; credibility: number }>;
          webSearchAnalysis?: { summary?: string };
          originTracing?: {
            hypothesizedOrigin?: string;
            firstSeenDates?: Array<{
              source: string;
              date?: string;
              url?: string;
            }>;
            propagationPaths?: string[];
          };
          beliefDrivers?: Array<{
            name: string;
            description: string;
            references?: Array<{ title: string; url: string }>;
          }>;
        }

        const resultData = factCheck.data as FactCheckData;

        // Perform political bias analysis
        const politicalBiasAnalysis = await analyzePoliticalBias(
          textToFactCheck,
          `Web content analysis from source: ${webData?.title || 'unknown article'}`
        );

        // Perform sentiment analysis using AWS Comprehend
        const sentimentAnalysis = await analyzeSentiment(
          textToFactCheck,
          webData.metadata?.language || "en",
          context.requestId
        );

        const factCheckResult: FactCheckResult = {
          verdict:
            (resultData.overallStatus as FactCheckResult["verdict"]) ||
            "unverified",
          confidence: resultData.confidence || 30, // Use fallback confidence for unverified content
          explanation: resultData.reasoning || "No analysis available",
          content:
            textToFactCheck.substring(0, 500) +
            (textToFactCheck.length > 500 ? "..." : ""),
          sources: resultData.sources || [],
          flags: sentimentAnalysis?.flags || [],
          originTracing: resultData.originTracing,
          beliefDrivers: resultData.beliefDrivers,
          politicalBias: politicalBiasAnalysis,
          sentimentAnalysis: sentimentAnalysis
            ? {
                overall: sentimentAnalysis.overall,
                scores: sentimentAnalysis.scores,
                keyPhrases: sentimentAnalysis.keyPhrases,
                entities: sentimentAnalysis.entities,
                emotionalIntensity: sentimentAnalysis.emotionalIntensity,
                flags: sentimentAnalysis.flags,
              }
            : undefined,
        };

        // Lightweight parsing fallback from reasoning text when structured fields are absent
        if (
          (!factCheckResult.originTracing || !factCheckResult.beliefDrivers) &&
          resultData.reasoning
        ) {
          try {
            const txt = resultData.reasoning;
            const originMatch = txt.match(
              /\n?-?\s*Origin Tracing(?:[^\n]*):?\s*([\s\S]*?)(?:\n-{2,}|\n?-?\s*Why People Believe This|$)/i
            );
            if (originMatch) {
              const originText = originMatch[1].trim();
              if (originText) {
                factCheckResult.originTracing =
                  factCheckResult.originTracing || ({} as any);
                (factCheckResult.originTracing as any).hypothesizedOrigin =
                  originText.substring(0, 600);
              }
            }
            const beliefMatch = txt.match(
              /\n?-?\s*Why People Believe This(?:[^\n]*):?\s*([\s\S]*?)(?:\n-{2,}|$)/i
            );
            if (beliefMatch) {
              const beliefText = beliefMatch[1].trim();
              if (beliefText) {
                const items = beliefText
                  .split(/\n(?:-\s+|\*\s+|\d+\.\s+)/)
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .slice(0, 5);
                if (items.length > 0) {
                  factCheckResult.beliefDrivers = items.map((s) => ({
                    name:
                      s.split(/[:–-]/)[0].trim().slice(0, 60) ||
                      "Belief Driver",
                    description: s,
                  }));
                }
              }
            }
          } catch {}
        }

        logger.info("Fact-check completed", {
          requestId: context.requestId,
          platform: this.platform,
          operation: "fact-check",
          metadata: {
            verdict: factCheckResult.verdict,
            confidence: factCheckResult.confidence,
            sourcesCount: factCheckResult.sources.length,
            title: webData.title,
          },
        });

        return factCheckResult;
      }

      logger.warn("Fact-check service returned unsuccessful result", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "fact-check",
        metadata: { success: factCheck.success, title: webData.title },
      });

      // Return fallback result
      return {
        verdict: "unverified",
        confidence: 30, // More reasonable default for unverified content
        explanation:
          "Verification service temporarily unavailable. Manual fact-checking recommended.",
        content:
          textToFactCheck.substring(0, 500) +
          (textToFactCheck.length > 500 ? "..." : ""),
        sources: [],
        flags: ["service_unavailable"],
      };
    } catch (error) {
      logger.error(
        "Fact-check process failed",
        {
          requestId: context.requestId,
          platform: this.platform,
          operation: "fact-check",
          metadata: { title: webData.title },
        },
        error as Error
      );

      // Return fallback instead of throwing
      return {
        verdict: "unverified",
        confidence: 0,
        explanation:
          "Fact-checking failed due to technical error. Manual verification recommended.",
        content:
          textToFactCheck.substring(0, 500) +
          (textToFactCheck.length > 500 ? "..." : ""),
        sources: [],
        flags: ["technical_error"],
      };
    }
  }

  /**
   * Calculate source/creator credibility rating based on fact-check results
   * @param factCheck - Fact-check results
   * @param extractedData - Original web content data
   * @param context - Processing context
   * @returns Credibility rating (0-10) or null if calculation fails
   */
  /**
   * Gets creator's historical credibility data for accumulative scoring
   */
  private async getCreatorHistoricalData(creatorId: string, context: ProcessingContext) {
    try {
      const existingCreator = await getCreator(creatorId, this.platform);
      if (existingCreator) {
        return {
          creatorHistoricalCredibility: (existingCreator as any).credibilityRating || 6.5,
          totalAnalyses: (existingCreator as any).totalAnalyses || 0,
        };
      }
      return {
        creatorHistoricalCredibility: 6.5, // Default starting credibility
        totalAnalyses: 0,
      };
    } catch (error) {
      logger.warn("Failed to get creator historical data", {
        requestId: context.requestId,
        platform: this.platform,
      });
      return {
        creatorHistoricalCredibility: 6.5,
        totalAnalyses: 0,
      };
    }
  }

  protected async calculateCredibility(
    factCheck: FactCheckResult | null,
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<number | null> {
    if (!factCheck || !extractedData) {
      logger.debug(
        "Skipping credibility calculation - no verified fact-check data",
        {
          requestId: context.requestId,
          platform: this.platform,
          operation: "calculate-credibility",
          metadata: {
            hasFactCheck: !!factCheck,
            hasExtractedData: !!extractedData,
          },
        }
      );
      return null;
    }

    const webData = extractedData as WebExtractedData;

    try {
      logger.debug("Calculating source credibility", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "calculate-credibility",
        metadata: {
          source: webData.creator,
          factCheckVerdict: factCheck.verdict,
          title: webData.title,
        },
      });

      const credibilityResult = await calculateCreatorCredibilityRating.execute(
        {
          factCheckResult: {
            verdict: factCheck.verdict,
            confidence: factCheck.confidence,
            isVerified: true,
            sources: (factCheck.sources || []).map(source => ({
              url: source.url,
              title: source.title,
              relevance: source.credibility / 10, // Convert credibility (0-10) to relevance (0-1)
            })),
          },
          contentMetadata: {
            creator: webData.creator || "Unknown",
            platform: this.platform,
            title: webData.title || "",
            hasTranscription: false, // Web content doesn't have transcription
            contentType: webData.type,
          },
          analysisMetrics: {
            hasNewsContent: true,
            needsFactCheck: true,
            contentLength: webData.content.length,
            sentimentAnalysis: factCheck.sentimentAnalysis ? {
              overall: factCheck.sentimentAnalysis.overall,
              emotionalIntensity: factCheck.sentimentAnalysis.emotionalIntensity,
              flags: factCheck.sentimentAnalysis.flags,
            } : undefined,
            // Get creator's historical credibility for accumulative scoring
            ...(await this.getCreatorHistoricalData(webData.creator || "unknown", context)),
          },
        },
        {
          toolCallId: "web-credibility-rating",
          messages: [],
        }
      );

      if (credibilityResult.success && credibilityResult.data) {
        const rating = credibilityResult.data.credibilityRating;

        logger.info("Source credibility calculated", {
          requestId: context.requestId,
          platform: this.platform,
          operation: "calculate-credibility",
          metadata: {
            source: webData.creator,
            rating,
            title: webData.title,
          },
        });

        return rating;
      }

      logger.warn("Credibility calculation returned unsuccessful result", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "calculate-credibility",
        metadata: {
          success: credibilityResult.success,
          title: webData.title,
        },
      });

      return null;
    } catch (error) {
      logger.warn(`Source credibility calculation failed: ${error}`, {
        requestId: context.requestId,
        platform: this.platform,
        operation: "calculate-credibility",
        metadata: { title: webData.title },
      });

      return null;
    }
  }
}

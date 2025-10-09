import { Scraper } from "@the-convocation/twitter-scraper";
import {
  BaseHandler,
  ProcessingContext,
  ExtractedContent,
  TranscriptionResult,
  FactCheckResult,
} from "./base-handler";
import { ApiError } from "../../../../lib/api-error";
import { transcribeVideoDirectly } from "../../../../tools/index";
import { getCreator } from "../../../../lib/db/repo";
import { researchAndFactCheck } from "../../../../tools/fact-checking";
import { analyzePoliticalBias } from "../../../../tools/fact-checking/political-bias-analysis";
import { calculateCreatorCredibilityRating } from "../../../../tools/content-analysis";
import { extractTweetId } from "../../../../lib/validation";
import { logger } from "../../../../lib/logger";
import { analyzeSentiment } from "../../../../lib/sentiment-analysis";

/**
 * Twitter-specific data extracted from the platform
 */
interface TwitterExtractedData extends ExtractedContent {
  tweetId: string;
  text: string;
  videoUrls?: string[];
  type: "tweet";
}

/**
 * Twitter content handler
 *
 * Handles the complete processing pipeline for Twitter/X posts:
 * 1. Extract tweet metadata and media URLs
 * 2. Transcribe video content if present
 * 3. Fact-check the tweet text content
 * 4. Calculate creator credibility rating
 *
 * @example
 * ```typescript
 * const handler = new TwitterHandler();
 * const result = await handler.process(twitterUrl, context);
 * ```
 */
export class TwitterHandler extends BaseHandler {
  private scraper: Scraper;

  constructor() {
    super("twitter");
    this.scraper = new Scraper();
  }

  /**
   * Extract Twitter post metadata and media URLs
   * @param url - Twitter post URL
   * @param context - Processing context
   * @returns Extracted Twitter data
   * @throws ApiError if extraction fails
   */
  protected async extractContent(
    url: string,
    context: ProcessingContext
  ): Promise<ExtractedContent | null> {
    logger.debug("Extracting Twitter content", {
      requestId: context.requestId,
      platform: this.platform,
      operation: "extract-content",
      metadata: { url },
    });

    try {
      const tweetId = extractTweetId(url);
      const tweet = await this.scraper.getTweet(tweetId);

      if (!tweet) {
        throw ApiError.twitterFetchFailed(
          tweetId,
          new Error("Twitter scraper returned null")
        );
      }

      const videoUrls =
        tweet.videos
          ?.map((video) => video.url)
          .filter((url): url is string => Boolean(url)) || [];

      const result: TwitterExtractedData = {
        title: tweet.text || "Twitter Post",
        description: tweet.text || "",
        creator: tweet.username || "Unknown",
        tweetId,
        text: tweet.text || "",
        videoUrls: videoUrls.length > 0 ? (videoUrls as string[]) : undefined,
        type: "tweet",
      };

      return result;
    } catch (error) {
      logger.error(
        "Twitter content extraction failed",
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

      throw ApiError.twitterFetchFailed(url, error as Error);
    }
  }

  /**
   * Transcribe Twitter video content to text
   * @param extractedData - Data extracted from Twitter
   * @param context - Processing context
   * @returns Transcription result or null if no video or transcription fails
   */
  protected async transcribeContent(
    extractedData: ExtractedContent | null,
    context: ProcessingContext
  ): Promise<TranscriptionResult | null> {
    if (!extractedData) {
      return null;
    }

    const twitterData = extractedData as TwitterExtractedData;

    if (!twitterData.videoUrls || twitterData.videoUrls.length === 0) {
      logger.debug("No video URLs available for transcription", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "transcribe-content",
        metadata: { hasVideoUrls: false },
      });
      return null;
    }

    // Use the first video URL for transcription
    const videoUrl = twitterData.videoUrls[0];

    try {
      logger.debug("Starting video transcription", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "transcribe-content",
        metadata: { videoUrl, totalVideos: twitterData.videoUrls.length },
      });

      const transcriptionResult = await transcribeVideoDirectly(videoUrl);

      if (transcriptionResult.success && transcriptionResult.data) {
        logger.info("Video transcription completed", {
          requestId: context.requestId,
          platform: this.platform,
          operation: "transcribe-content",
          metadata: {
            textLength: transcriptionResult.data.text?.length || 0,
            language: transcriptionResult.data.language,
          },
        });

        // Transform the transcription result to match our interface
        interface TranscriptionSegment {
          startSecond: number;
          endSecond: number;
          text: string;
        }

        const transformed: TranscriptionResult = {
          text: transcriptionResult.data.text,
          segments:
            transcriptionResult.data.segments?.map(
              (segment: TranscriptionSegment) => ({
                start: segment.startSecond || 0,
                end: segment.endSecond || 0,
                text: segment.text,
              })
            ) || [],
          language: transcriptionResult.data.language,
        };

        return transformed;
      }

      logger.warn("Video transcription returned no data", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "transcribe-content",
        metadata: { success: transcriptionResult.success },
      });

      return null;
    } catch (error) {
      logger.warn(
        `Video transcription failed, continuing without transcription: ${error}`,
        {
          requestId: context.requestId,
          platform: this.platform,
          operation: "transcribe-content",
        }
      );

      // Don't throw error for transcription failures - continue without it
      return null;
    }
  }

  /**
   * Fact-check the tweet content using text and transcription
   * @param transcription - Transcribed text from video
   * @param extractedData - Original Twitter data
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

    const twitterData = extractedData as TwitterExtractedData;
    const textToFactCheck = transcription?.text || twitterData.text;

    if (!textToFactCheck || textToFactCheck.trim().length === 0) {
      logger.debug("No content available for fact-checking", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "fact-check",
        metadata: {
          hasTranscription: !!transcription?.text,
          hasTweetText: !!twitterData.text,
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
          creator: twitterData.creator,
          tweetId: twitterData.tweetId,
        },
      });

      const contextPrompt = `Twitter/X Content Analysis Context:
- Creator: ${twitterData.creator}
- Tweet Content: "${twitterData.text}"
- Tweet URL: ${context.url}
- Platform: Twitter/X

${transcription ? `Transcribed Content: "${transcription.text}"` : ""}

Please fact-check the claims from this Twitter/X post content, paying special attention to ${
        transcription
          ? "both the tweet text and the transcribed speech"
          : "the tweet text"
      }. Consider the context that this is social media content that may contain opinions, personal experiences, or claims that need verification.`;

      const factCheck = await researchAndFactCheck.execute(
        {
          transcription: textToFactCheck,
          title: twitterData.text,
          context: contextPrompt,
        },
        {
          toolCallId: "twitter-verification",
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
        }

        const resultData = factCheck.data as FactCheckData;

        // Perform political bias analysis
        const politicalBiasAnalysis = await analyzePoliticalBias(
          textToFactCheck,
          `Twitter/X content analysis from user: ${twitterData?.username || 'unknown'}`
        );

        // Perform sentiment analysis using AWS Comprehend
        const sentimentAnalysis = await analyzeSentiment(
          textToFactCheck,
          transcription?.language || "en",
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

        logger.info("Fact-check completed", {
          requestId: context.requestId,
          platform: this.platform,
          operation: "fact-check",
          metadata: {
            verdict: factCheckResult.verdict,
            confidence: factCheckResult.confidence,
            sourcesCount: factCheckResult.sources.length,
            tweetId: twitterData.tweetId,
          },
        });

        return factCheckResult;
      }

      logger.warn("Fact-check service returned unsuccessful result", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "fact-check",
        metadata: {
          success: factCheck.success,
          tweetId: twitterData.tweetId,
          toolError: (factCheck as any)?.error || undefined,
          envHints: {
            missingExaApiKey: !process.env.EXA_API_KEY,
            missingBedrockModelId: !process.env.BEDROCK_MODEL_ID,
            awsRegionConfigured: !!(process.env.APP_REGION || process.env.AWS_REGION),
          },
          contentStats: {
            hasTranscription: !!transcription?.text,
            tweetTextLength: twitterData.text?.length || 0,
          },
        },
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
          metadata: { tweetId: twitterData.tweetId },
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

  /**
   * Calculate creator credibility rating based on fact-check results
   * @param factCheck - Fact-check results
   * @param extractedData - Original Twitter data
   * @param context - Processing context
   * @returns Credibility rating (0-10) or null if calculation fails
   */
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

    const twitterData = extractedData as TwitterExtractedData;

    try {
      logger.debug("Calculating creator credibility", {
        requestId: context.requestId,
        platform: this.platform,
        operation: "calculate-credibility",
        metadata: {
          creator: twitterData.creator,
          factCheckVerdict: factCheck.verdict,
          tweetId: twitterData.tweetId,
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
            creator: twitterData.creator || "Unknown",
            platform: this.platform,
            title: twitterData.text || "",
            hasTranscription: !!twitterData.videoUrls,
            contentType: twitterData.type,
          },
          analysisMetrics: {
            hasNewsContent: true,
            needsFactCheck: true,
            contentLength: twitterData.text.length,
            sentimentAnalysis: factCheck.sentimentAnalysis ? {
              overall: factCheck.sentimentAnalysis.overall,
              emotionalIntensity: factCheck.sentimentAnalysis.emotionalIntensity,
              flags: factCheck.sentimentAnalysis.flags,
            } : undefined,
            // Get creator's historical credibility for accumulative scoring
            ...(await this.getCreatorHistoricalData(twitterData.creator || "unknown", context)),
          },
        },
        {
          toolCallId: "twitter-credibility-rating",
          messages: [],
        }
      );

      if (credibilityResult.success && credibilityResult.data) {
        const rating = credibilityResult.data.credibilityRating;

        logger.info("Creator credibility calculated", {
          requestId: context.requestId,
          platform: this.platform,
          operation: "calculate-credibility",
          metadata: {
            creator: twitterData.creator,
            rating,
            tweetId: twitterData.tweetId,
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
          tweetId: twitterData.tweetId,
        },
      });

      return null;
    } catch (error) {
      logger.warn(`Creator credibility calculation failed: ${error}`, {
        requestId: context.requestId,
        platform: this.platform,
        operation: "calculate-credibility",
        metadata: { tweetId: twitterData.tweetId },
      });

      return null;
    }
  }
}

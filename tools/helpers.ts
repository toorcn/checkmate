import FirecrawlApp from "@mendable/firecrawl-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import { config } from "../lib/config";
import { s3, transcribe } from "../lib/aws";
import { getFirecrawlApiKey } from "../lib/secrets";

/**
 * Helper function to transcribe a video directly from a given URL using OpenAI Whisper.
 * @param {string} videoUrl - The direct URL of the video to transcribe.
 * @returns {Promise<{ success: boolean; data?: { text: string; segments: any[]; language: string }; error?: string }>} Transcription result object.
 */
export async function transcribeVideoDirectly(videoUrl: string) {
  try {
    if (!videoUrl) {
      return {
        success: false,
        error: "Video URL is required",
      };
    }

    // Ensure AWS env is configured
    if (!config.APP_REGION || !config.S3_BUCKET) {
      return {
        success: false,
        error: "APP_REGION and S3_BUCKET must be configured for transcription",
      };
    }

    // Download the video content
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return {
        success: false,
        error: "Failed to fetch video",
      };
    }

    // Get the video as an array buffer
    const videoArrayBuffer = await videoResponse.arrayBuffer();
    const videoBuffer = Buffer.from(videoArrayBuffer);

    // Upload media to S3 for Transcribe
    const key = `uploads/transcribe/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.mp4`;

    const contentType =
      videoResponse.headers.get("content-type") || "application/octet-stream";

    await s3.send(
      new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: videoBuffer,
        ContentType: contentType,
      })
    );

    // Start Transcribe job
    const jobName = `job-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    await transcribe.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: "en-US",
        Media: { MediaFileUri: `s3://${config.S3_BUCKET}/${key}` },
        OutputBucketName: config.S3_BUCKET,
      })
    );

    // Poll until job completes or times out
    const start = Date.now();
    const timeoutMs = config.TRANSCRIPTION_TIMEOUT_MS;
    let transcriptUri: string | undefined;
    let language = "en-US";
    while (Date.now() - start < timeoutMs) {
      const resp = await transcribe.send(
        new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
      );
      const job = resp.TranscriptionJob;
      if (!job) break;
      if (job.TranscriptionJobStatus === "COMPLETED") {
        transcriptUri = job.Transcript?.TranscriptFileUri;
        language = (job?.LanguageCode as string) || language;
        break;
      }
      if (job.TranscriptionJobStatus === "FAILED") {
        return {
          success: false,
          error: job.FailureReason || "Transcription failed",
        };
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    if (!transcriptUri) {
      return { success: false, error: "Transcription timed out" };
    }

    // Fetch transcript JSON
    const trRes = await fetch(transcriptUri);
    if (!trRes.ok) {
      return { success: false, error: "Failed to fetch transcript" };
    }
    const trJson = await trRes.json();
    const text = trJson?.results?.transcripts?.[0]?.transcript || "";
    const segments = trJson?.results?.items || [];

    return {
      success: true,
      data: { text, segments, language },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
  }
}

/**
 * Helper function to scrape web content using Firecrawl for non-TikTok/Twitter URLs.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<{ success: boolean; data?: { title: string; content: string; author?: string; description?: string }; error?: string }>} Scraping result object.
 */
export async function scrapeWebContent(url: string) {
  try {
    if (!url) {
      return {
        success: false,
        error: "URL is required",
      };
    }

    // Get Firecrawl API key from Secrets Manager (or env fallback)
    let firecrawlApiKey: string;
    try {
      firecrawlApiKey = await getFirecrawlApiKey();
    } catch (error) {
      return {
        success: false,
        error: "Firecrawl API key not configured",
      };
    }

    if (!firecrawlApiKey) {
      return {
        success: false,
        error: "Firecrawl API key not configured",
      };
    }

    // Initialize Firecrawl
    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

    // Scrape the URL
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ["markdown", "html"],
      includeTags: ["title", "meta", "article", "main", "content"],
      excludeTags: ["nav", "footer", "sidebar", "advertisement"],
      waitFor: 1000,
    });

    if (!scrapeResult.success) {
      return {
        success: false,
        error: "Failed to scrape content from URL",
      };
    }

    const { metadata, markdown, html } = scrapeResult;

    // Extract relevant information
    const title = metadata?.title || metadata?.ogTitle || "Untitled Content";
    const description = metadata?.description || metadata?.ogDescription || "";
    const author = metadata?.author || metadata?.ogSiteName || "";
    const content = markdown || html || "";

    return {
      success: true,
      data: {
        title,
        content,
        author,
        description,
        metadata: {
          url: metadata?.sourceURL || url,
          publishedTime: metadata?.publishedTime,
          modifiedTime: metadata?.modifiedTime,
          keywords: metadata?.keywords,
          language: metadata?.language,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Scraping failed",
    };
  }
}

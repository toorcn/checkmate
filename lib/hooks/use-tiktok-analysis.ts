import { useState } from "react";
// Convex-dependent save operations removed during migration.

interface TranscriptionData {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  language?: string;
}

interface NewsDetection {
  hasNewsContent: boolean;
  confidence: number;
  newsKeywordsFound: string[];
  potentialClaims: string[];
  needsFactCheck: boolean;
  contentType: string;
}

interface FactCheckSource {
  title: string;
  url: string;
  source: string;
  relevance: number;
  description?: string;
}

interface FactCheckResult {
  claim: string;
  status: string;
  confidence: number;
  analysis?: string;
  sources?: FactCheckSource[];
  error?: string;
}

interface FactCheckData {
  totalClaims: number;
  checkedClaims: number;
  results: FactCheckResult[];
  summary: {
    verifiedTrue: number;
    verifiedFalse: number;
    misleading: number;
    unverifiable: number;
    needsVerification: number;
  };
  sources?: FactCheckSource[];
}

interface TikTokAnalysisData {
  transcription: TranscriptionData;
  metadata: {
    title: string;
    description: string;
    creator: string;
    originalUrl: string;
    platform?: string;
  };
  newsDetection: NewsDetection | null;
  factCheck: FactCheckData | null;
  requiresFactCheck: boolean;
  creatorCredibilityRating?: number;
}

interface TikTokAnalysisResult {
  success: boolean;
  data?: TikTokAnalysisData;
  error?: string;
}

export function useTikTokAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TikTokAnalysisResult | null>(null);
  const [isSaving, _setIsSaving] = useState(false);

  const analyzeTikTok = async (
    url: string,
    saveToDb = false // Changed default to false to prevent auto-save duplicates
  ): Promise<TikTokAnalysisResult> => {
    setIsLoading(true);
    setResult(null);

    try {
      // Validate URL format (TikTok, Twitter, or general web URL)
      const tiktokUrlPattern =
        /^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/;
      const twitterUrlPattern =
        /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/;

      // Basic URL validation for any other web content
      try {
        new URL(url);
      } catch {
        throw new Error("Invalid URL format. Please provide a valid URL.");
      }

      // Determine platform and set appropriate body parameter
      const isTikTok = tiktokUrlPattern.test(url);
      const isTwitter = twitterUrlPattern.test(url);

      const requestBody: {
        tiktokUrl?: string;
        twitterUrl?: string;
        webUrl?: string;
      } = {};
      if (isTikTok) {
        requestBody.tiktokUrl = url;
      } else if (isTwitter) {
        requestBody.twitterUrl = url;
      } else {
        requestBody.webUrl = url;
      }

      // Call the transcribe API route
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to analyze ${
              isTikTok ? "TikTok" : isTwitter ? "Twitter" : "web"
            } content`
        );
      }

      // const analysis: TikTokAnalysisResult = await response.json();
      const analysis: TikTokAnalysisResult = await response.json();
      // Removed console.log statements for API response and analysis data
      // Removed console.log statements for newsDetection, factCheck, and summary
      // Removed console.log for no fact-check results

      // Auto-save temporarily disabled while Convex is removed.

      setResult(analysis);
      return analysis;
    } catch (error) {
      const errorResult = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setIsLoading(false);
  };

  return {
    analyzeTikTok,
    isLoading,
    isSaving,
    result,
    reset,
  };
}

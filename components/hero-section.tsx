"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PlayIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookmarkIcon,
  ShieldIcon,
  SearchIcon,
  SmileIcon,
} from "lucide-react";
import { useTikTokAnalysis } from "@/lib/hooks/use-tiktok-analysis";
import { useSaveTikTokAnalysisWithCredibility } from "@/lib/hooks/use-saved-analyses";
import { useAnimatedProgress } from "@/lib/hooks/use-animated-progress";
import React from "react";
import { toast } from "sonner";
import { AnalysisRenderer } from "@/components/analysis-renderer";
import { useLanguage } from "@/components/language-provider";
import { OriginTracingDiagram } from "@/components/analysis/origin-tracing-diagram";
import { useDiagramExpansion } from "@/lib/hooks/useDiagramExpansion";
import { PoliticalBiasMeter } from "@/components/ui/political-bias-meter";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";

interface HeroSectionProps {
  initialUrl?: string;
}

interface FactCheckResult {
  verdict: "verified" | "misleading" | "false" | "unverified" | "satire";
  confidence: number;
  explanation: string;
  content: string;
  sources: Array<{
    url: string;
    title: string;
    credibility: number;
  }>;
  flags: string[];
  originTracing?: {
    hypothesizedOrigin?: string;
    firstSeenDates?: Array<{ source: string; date?: string; url?: string }>;
    propagationPaths?: string[];
  };
  beliefDrivers?: Array<{
    name: string;
    description: string;
    references?: Array<{ title: string; url: string }>;
  }>;
}

export function HeroSection({ initialUrl = "" }: HeroSectionProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [isDetailedAnalysisExpanded, setIsDetailedAnalysisExpanded] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const { isExpanded: isDiagramExpanded } = useDiagramExpansion();
  const [mockResult, setMockResult] = useState<{
    success: boolean;
    data: {
      transcription: {
        text: string;
        segments: Array<{
          start: number;
          end: number;
          text: string;
        }>;
        language: string;
      };
      metadata: {
        title: string;
        description: string;
        creator: string;
        originalUrl: string;
        platform: string;
      };
      factCheck: {
        verdict: "verified" | "misleading" | "false" | "unverified" | "satire";
        confidence: number;
        explanation: string;
        content: string;
        sources: Array<{
          title: string;
          url: string;
          credibility: number;
        }>;
        flags: string[];
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
      };
      requiresFactCheck: boolean;
      creatorCredibilityRating: number;
      newsDetection: {
        hasNewsContent: boolean;
        confidence: number;
        newsKeywordsFound: string[];
        potentialClaims: string[];
        needsFactCheck: boolean;
        contentType: string;
      };
      originTracingData?: any;
    };
  } | null>(null);
  const { analyzeTikTok, isLoading, result, reset } = useTikTokAnalysis();
  const {
    progress,
    isAnimating,
    startProgress,
    stopProgress,
    resetProgress,
  } = useAnimatedProgress({ duration: 20000 }); // 30 seconds
  const { user } = useAuth();
  const isSignedIn = !!user;

  const saveTikTokAnalysisWithCredibility =
    useSaveTikTokAnalysisWithCredibility();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (result) {
      if (result.success) {
        toast.success(t.analysisComplete);
      } else if (result.error) {
        toast.error(result.error);
      }
    }
  }, [result, t]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error(t.enterUrl);
      return;
    }

    // Update URL with query parameter
    const params = new URLSearchParams();
    params.set("link", url.trim());
    router.replace(`?${params.toString()}`);

    toast.info(t.analysisStarted);
    startProgress(); // Start the 30-second progress animation
    await analyzeTikTok(url.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAnalyze();
  };

  const handleReset = () => {
    setUrl("");
    setIsAnalysisExpanded(false);
    setIsDetailedAnalysisExpanded(false);
    setIsSaved(false);
    setSavedId(null);
    setMockResult(null);
    resetProgress();
    reset();
  };

  const handleMockAnalysis = async () => {
    if (!url.trim()) {
      toast.error(t.enterUrl);
      return;
    }

    setIsMockLoading(true);
    toast.info("Running Mock Analysis (Free!)");
    startProgress(); // Start the 30-second progress animation

    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate realistic mock data matching current API structure
    const mockData = {
      success: true,
      data: {
        transcription: {
          text: `This is a mock transcription of the content from ${url}. 

The AI has simulated transcribing the audio/video content. In this mock analysis, we're demonstrating how the system would extract spoken words, identify key claims, and prepare them for fact-checking.

Key simulated claims found:
- Mock claim about current events
- Simulated statement requiring verification
- Example of content that would trigger fact-checking processes`,
          segments: [
            {
              start: 0,
              end: 10,
              text: "This is a mock transcription of the content",
            },
            {
              start: 10,
              end: 25,
              text: "demonstrating how the system would extract spoken words",
            },
          ],
          language: "en",
        },
        metadata: {
          title: "Mock Content Analysis - Demo Mode",
          description:
            "This is a simulated analysis showing how Checkmate would process real content without using expensive APIs.",
          creator: "MockCreator123",
          originalUrl: url,
          platform: url.includes("tiktok")
            ? "tiktok"
            : url.includes("twitter")
              ? "twitter"
              : "web",
        },
        factCheck: {
          verdict: "verified" as const,
          confidence: 85,
          explanation: `**Mock Fact-Check Analysis:**

This is a demonstration of how our AI fact-checking system would analyze the content. In a real scenario, this would involve:

**Verification Process:**
- Web search across credible news sources
- Cross-referencing with fact-checking databases  
- Analysis of source credibility and bias
- Evaluation of evidence quality

**Mock Findings:**
- **Primary Claims**: The content contains 2-3 verifiable statements
- **Source Quality**: Simulated cross-reference with Reuters, AP News, BBC
- **Confidence Level**: High confidence based on multiple corroborating sources
- **Recommendation**: Content appears to be factually accurate based on available evidence

**Origin Tracing Investigation:**
This claim appears to have originated from legitimate news sources around early 2024. The information has been consistently reported by multiple credible outlets including Reuters, Associated Press, and BBC News. The claim has maintained accuracy as it spread through various social media platforms.

**Note**: This is a demonstration using mock data to show the analysis process without incurring API costs.`,
          content:
            "Mock content summary: The system has analyzed the provided URL and generated this demo fact-check result to show how real analysis would work.",
          sources: [
            {
              title: "Reuters Fact Check: [Sample] Fact-checking common vaccine claims",
              url: "https://www.reuters.com/fact-check/",
              credibility: 0.9,
            },
            {
              title: "BBC Reality Check: [Sample] Verifying viral social media claims",
              url: "https://www.bbc.com/news/reality_check",
              credibility: 0.85,
            },
            {
              title: "AP News Fact Check: [Sample] Investigating misinformation",
              url: "https://apnews.com/ap-fact-check",
              credibility: 0.8,
            },
          ],
          flags: ["verified-sources", "high-credibility"],
          originTracing: {
            hypothesizedOrigin:
              "This claim appears to have originated from a Reuters report published in early 2024, which was then picked up by other major news outlets including BBC and Associated Press. The information has been consistently verified across multiple credible sources.",
            firstSeenDates: [
              {
                source: "Reuters",
                date: "2024-01-15",
                url: "https://www.reuters.com/fact-check/",
              },
              {
                source: "BBC News",
                date: "2024-01-16",
                url: "https://www.bbc.com/news/reality_check",
              },
              {
                source: "Associated Press",
                date: "2024-01-16",
                url: "https://apnews.com/ap-fact-check",
              },
            ],
            propagationPaths: ["news-media", "twitter", "tiktok", "facebook"],
          },
          beliefDrivers: [
            {
              name: "Source Credibility",
              description:
                "People trust this information because it comes from established, reputable news organizations with strong fact-checking standards.",
              references: [
                {
                  title: "International Fact-Checking Network - Poynter",
                  url: "https://www.poynter.org/ifcn/",
                },
              ],
            },
            {
              name: "Consensus Reporting",
              description:
                "Multiple independent news sources reporting the same facts increases confidence in the information's accuracy.",
              references: [
                {
                  title: "FactCheck.org - Annenberg Public Policy Center",
                  url: "https://www.factcheck.org/",
                },
              ],
            },
            {
              name: "Authority Bias",
              description:
                "Information from recognized news authorities is more readily believed due to their established reputation.",
              references: [
                {
                  title: "Snopes.com - Fact Checking and Debunking Urban Legends",
                  url: "https://www.snopes.com/",
                },
              ],
            },
          ],
        },
        requiresFactCheck: true,
        creatorCredibilityRating: 7.2,
        newsDetection: {
          hasNewsContent: true,
          confidence: 0.9,
          newsKeywordsFound: ["breaking", "reports", "officials"],
          potentialClaims: [
            "Mock claim about current events",
            "Simulated statement requiring verification",
            "Example of content that would trigger fact-checking processes",
          ],
          needsFactCheck: true,
          contentType: "news_factual",
        },
        originTracingData: {
          originTracing: {
            hypothesizedOrigin:
              "This claim appears to have originated from a Reuters report published in early 2024, which was then picked up by other major news outlets including BBC and Associated Press. The information has been consistently verified across multiple credible sources.",
            firstSeenDates: [
              {
                source: "Reuters",
                date: "2024-01-15",
                url: "https://www.reuters.com/fact-check/",
              },
              {
                source: "BBC News",
                date: "2024-01-16",
                url: "https://www.bbc.com/news/reality_check",
              },
              {
                source: "Associated Press",
                date: "2024-01-16",
                url: "https://apnews.com/ap-fact-check",
              },
            ],
            evolutionSteps: [
              {
                platform: "Reuters",
                transformation:
                  "Original breaking news report with official sources and verification",
                impact: "Established the factual foundation",
                date: "2024-01-15",
              },
              {
                platform: "BBC News",
                transformation:
                  "Independent verification and additional context added",
                impact:
                  "Increased credibility through second-source confirmation",
                date: "2024-01-16",
              },
              {
                platform: "Twitter",
                transformation: "Simplified into shareable social media format",
                impact: "Reached broader audience while maintaining accuracy",
                date: "2024-01-17",
              },
              {
                platform: "TikTok",
                transformation:
                  "Adapted into short-form video content with visual aids",
                impact: "Made information accessible to younger demographics",
                date: "2024-01-18",
              },
            ],
            propagationPaths: ["news-media", "twitter", "tiktok", "facebook"],
          },
          beliefDrivers: [
            {
              name: "Source Credibility",
              description:
                "People trust this information because it comes from established, reputable news organizations with strong fact-checking standards.",
              references: [
                {
                  title: "International Fact-Checking Network - Poynter",
                  url: "https://www.poynter.org/ifcn/",
                },
              ],
            },
            {
              name: "Consensus Reporting",
              description:
                "Multiple independent news sources reporting the same facts increases confidence in the information's accuracy.",
              references: [
                {
                  title: "FactCheck.org - Annenberg Public Policy Center",
                  url: "https://www.factcheck.org/",
                },
              ],
            },
            {
              name: "Authority Bias",
              description:
                "Information from recognized news authorities is more readily believed due to their established reputation.",
              references: [
                {
                  title: "Snopes.com - Fact Checking and Debunking Urban Legends",
                  url: "https://www.snopes.com/",
                },
              ],
            },
          ],
          sources: [
            {
              url: "https://www.reuters.com/fact-check/",
              title: "Reuters Fact Check: [Sample] Fact-checking common vaccine claims",
              source: "Reuters",
              credibility: 0.9,
            },
            {
              url: "https://www.bbc.com/news/reality_check",
              title: "BBC Reality Check: [Sample] Verifying viral social media claims",
              source: "BBC News",
              credibility: 0.85,
            },
            {
              url: "https://apnews.com/ap-fact-check",
              title: "AP News Fact Check: [Sample] Investigating misinformation",
              source: "Associated Press",
              credibility: 0.8,
            },
          ],
          verdict: "verified",
          content:
            "Mock content summary: The system has analyzed the provided URL and generated this demo fact-check result to show how real analysis would work.",
          claim:
            "This is a mock demonstration of how claims would be analyzed and verified through the fact-checking system.",
          allLinks: [
            {
              url: "https://www.reuters.com/fact-check/",
              title: "Reuters Fact Check: [Sample] Fact-checking common vaccine claims",
            },
            {
              url: "https://www.bbc.com/news/reality_check",
              title: "BBC Reality Check: [Sample] Verifying viral social media claims",
            },
            {
              url: "https://apnews.com/ap-fact-check",
              title: "AP News Fact Check: [Sample] Investigating misinformation",
            },
          ],
        },
      },
    };

    setMockResult(mockData);
    setIsMockLoading(false);
    toast.success("Mock Analysis Complete! (No API costs incurred)");
  };

  const handleSaveAnalysis = async () => {
    const dataSource =
      result?.success && result.data
        ? result.data
        : mockResult?.success && mockResult.data
          ? mockResult.data
          : null;
    if (!dataSource || !isSignedIn) {
      toast.error(t.cannotSave);
      return;
    }

    // Check if already saved by the automatic save in useTikTokAnalysis hook
    // This prevents duplicate saves
    if (isSaved) {
      toast.info(t.alreadySaved);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the data for saving, mapping to schema format
      const saveData = {
        videoUrl: dataSource.metadata.originalUrl,
        transcription: dataSource.transcription
          ? {
              text: dataSource.transcription.text,
              language: dataSource.transcription.language,
              // Note: duration not available from API yet, will be undefined
            }
          : undefined,
        metadata: dataSource.metadata
          ? {
              title: dataSource.metadata.title,
              description: dataSource.metadata.description,
              creator: dataSource.metadata.creator,
              originalUrl: dataSource.metadata.originalUrl,
              platform: dataSource.metadata.platform,
            }
          : undefined,
        newsDetection: dataSource.newsDetection
          ? {
              hasNewsContent: dataSource.newsDetection.hasNewsContent,
              confidence: dataSource.newsDetection.confidence,
              newsKeywordsFound: dataSource.newsDetection.newsKeywordsFound,
              potentialClaims: dataSource.newsDetection.potentialClaims,
              needsFactCheck: dataSource.newsDetection.needsFactCheck,
              contentType: dataSource.newsDetection.contentType,
            }
          : undefined,
        factCheck: dataSource.factCheck
          ? {
              // Map from FactCheckResult to schema format
              verdict: (dataSource.factCheck as unknown as FactCheckResult)
                .verdict,
              confidence: (dataSource.factCheck as unknown as FactCheckResult)
                .confidence,
              explanation: (dataSource.factCheck as unknown as FactCheckResult)
                .explanation,
              content: (dataSource.factCheck as unknown as FactCheckResult)
                .content,
              // Persist full diagram data where available
              originTracing: (
                dataSource.factCheck as unknown as FactCheckResult
              ).originTracing,
              beliefDrivers: (
                dataSource.factCheck as unknown as FactCheckResult
              ).beliefDrivers,
              sources: (
                dataSource.factCheck as unknown as FactCheckResult
              ).sources?.map((source) => ({
                title: source.title,
                url: source.url,
                source: source.title, // Use title as source fallback for compatibility
                relevance: source.credibility,
              })),
            }
          : undefined,
        requiresFactCheck: dataSource.requiresFactCheck,
        // Use creator credibility rating if available, or default to neutral rating
        creatorCredibilityRating:
          dataSource.creatorCredibilityRating == null
            ? 5
            : Math.round(Number(dataSource.creatorCredibilityRating)),
        // Persist creator linkage for creator pages/filters
        contentCreatorId: dataSource.metadata?.creator,
      };

      // Use enhanced save function to properly handle content creators
      const resp = await saveTikTokAnalysisWithCredibility(saveData);
      if (resp && resp.id) {
        setSavedId(resp.id as string);
      }

      setIsSaved(true);
      toast.success(t.analysisSaved);
    } catch (error) {
      console.error("Failed to save analysis:", error);
      toast.error(t.failedToSave);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "false":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case "misleading":
        return <AlertTriangleIcon className="h-4 w-4 text-orange-500" />;
      case "unverified":
        return <AlertCircleIcon className="h-4 w-4 text-gray-500" />;
      case "satire":
        return <span className="text-purple-500 text-sm">🎭</span>;
      default:
        return <AlertCircleIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "false":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700">
            <XCircleIcon className="h-3 w-3 mr-1" />
            False Information
          </Badge>
        );
      case "misleading":
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Misleading Content
          </Badge>
        );
      case "unverified":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Insufficient Evidence
          </Badge>
        );
      case "satire":
        return (
          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
            <SmileIcon className="h-3 w-3 mr-1" />
            Satirical Content
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600">
            <SearchIcon className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
    }
  };

  const getAnalysisSummary = (factCheck: FactCheckResult) => {
    // Extract a meaningful summary from the analysis content
    if (factCheck.explanation) {
      // Get first meaningful paragraph from explanation
      const paragraphs = factCheck.explanation
        .split("\n")
        .filter((p) => p.trim().length > 50);
      if (paragraphs.length > 0) {
        // Get the first substantial paragraph and limit its length
        const firstParagraph = paragraphs[0].trim();
        // Break into sentences and take first few if it's too long
        if (firstParagraph.length > 300) {
          const sentences = firstParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
          if (sentences.length > 1) {
            // Take first 2-3 sentences for better readability
            const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ');
            return summary + (sentences.length > 3 ? '.' : '');
          }
        }
        return firstParagraph;
      }
    }

    // Fallback to content if explanation is not available
    if (factCheck.content) {
      const cleanContent = factCheck.content.trim();
      return cleanContent.length > 200
        ? cleanContent.substring(0, 200) + "..."
        : cleanContent;
    }

    // Final fallback
    return "Analysis summary is being generated based on credible sources and fact-checking methodology.";
  };

  const getVerdictDescription = (
    status: string,
    factCheck?: FactCheckResult
  ) => {
    // If we have factCheck data, use the actual analysis summary for description
    const analysisDescription = factCheck
      ? getAnalysisSummary(factCheck)
      : null;

    switch (status) {
      case "verified":
        return {
          title: "Content Verified",
          description:
            analysisDescription ||
            "Clear evidence supports the claims made in this content. Multiple credible sources confirm the accuracy of the information presented.",
        };
      case "true":
        return {
          title: "Factually Accurate",
          description:
            analysisDescription ||
            "The information presented is factually correct based on available evidence from reliable sources.",
        };
      case "false":
        return {
          title: "False Information",
          description:
            analysisDescription ||
            "The claims made in this content are factually incorrect and contradicted by credible evidence from reliable sources.",
        };
      case "misleading":
        return {
          title: "Misleading Content",
          description:
            analysisDescription ||
            "While some elements may be factually correct, the content lacks important context, presents selective information, or draws unsupported conclusions that could mislead viewers.",
        };
      case "unverifiable":
        return {
          title: "Insufficient Evidence",
          description:
            analysisDescription ||
            "There is not enough credible evidence available to verify or debunk the claims made in this content. Further investigation may be needed.",
        };
      case "satire":
        return {
          title: "Satirical Content",
          description:
            analysisDescription ||
            "This content appears to be satirical, parody, or comedy in nature. It should not be interpreted as factual information.",
        };
      default:
        return {
          title: "Overall Verification Status",
          description:
            analysisDescription ||
            "This content is currently being analyzed. The verification process is ongoing and results will be updated when available.",
        };
    }
  };

  return (
    <section className="py-24 md:py-32 relative">
      {/* Analysis Loading Overlay */}
      {(isLoading || isMockLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-auto shadow-2xl border-primary border-2 animate-in fade-in-0 zoom-in-95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <LoaderIcon className="h-6 w-6 animate-spin" />
                Analyzing Content...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} />
              <div className="text-base text-muted-foreground text-center">
                <p>
                  We are transcribing the video, detecting news content, and
                  fact-checking claims using AI.
                </p>
                <p className="mt-2">
                  This may take up to a minute for longer videos. Please don’t
                  close this tab.
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Checkmate is verifying sources, analyzing credibility, and
                  summarizing results for you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="text-center">
        <Badge variant="secondary" className="mb-4">
          AI-Powered Fact Checking
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          {t.heroTitle}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {t.heroSubtitle}
        </p>
        <div className="mx-auto max-w-2xl space-y-4 px-2 sm:px-4">
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 items-center justify-center"
          >
            <Input
              placeholder={t.urlPlaceholder}
              className="flex-1 h-12 text-base min-w-0 break-words"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading || isMockLoading}
            />
            <Button
              type="submit"
              size="lg"
              className="px-6 h-12 shrink-0"
              disabled={isLoading || isMockLoading || !url.trim()}
            >
              {isLoading ? (
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayIcon className="h-4 w-4 mr-2" />
              )}
              {isLoading ? t.analyzing : t.analyzeButton}
            </Button>
          </form>

          {/* Mock Analysis Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleMockAnalysis}
              variant="outline"
              size="lg"
              className="px-6 h-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600"
              disabled={isLoading || isMockLoading || !url.trim()}
            >
              {isMockLoading ? (
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldIcon className="h-4 w-4 mr-2" />
              )}
              {isMockLoading ? "Running Mock..." : "Try Mock Demo (Free!)"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Try it with any TikTok/Twitter(X) video URL to see the magic happen
          </p>

          {/* Mock Demo Description */}
          <div className="text-center">
            <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg inline-block">
              The mock demo simulates the full analysis process with realistic
              data—perfect for testing without API costs!
            </p>
          </div>
        </div>

        {/* Results */}
        {(result || mockResult) && (
          <div className="mx-auto max-w-7xl mt-8 px-2 sm:px-4">
            <Card className={isDiagramExpanded ? "overflow-visible" : "overflow-hidden"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result?.success || mockResult?.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  {result?.success || mockResult?.success
                    ? result?.success
                      ? t.analysisComplete
                      : "Mock Analysis Complete"
                    : "Analysis Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(result?.success && result.data) ||
                (mockResult?.success && mockResult.data) ? (
                  (() => {
                    // Determine which data source to use
                    const currentData =
                      result?.success && result.data
                        ? result.data
                        : mockResult?.data;
                    if (!currentData) return null;

                    // Safely access optional origin tracing augmentation when present (in mock data)
                    const originTracingData = (currentData as any)
                      ?.originTracingData;
                    return (
                      <div className="space-y-6 text-left">
                        {/* Video Metadata */}
                        <div className="border-b pb-4">
                          <h3 className="font-semibold text-lg mb-2 break-words">
                            {currentData.metadata.title}
                          </h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="break-words">
                              <span className="font-medium">Creator:</span> {currentData.metadata.creator}
                            </p>
                            <p>
                              <span className="font-medium">Platform:</span>{" "}
                              {currentData.metadata.platform || "Unknown"}
                            </p>
                            <p className="break-all">
                              <span className="font-medium">Original URL:</span>{" "}
                              <a
                                href={currentData.metadata.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                              >
                                {currentData.metadata.originalUrl}
                              </a>
                            </p>
                            {currentData.metadata.description &&
                              currentData.metadata.description !==
                                currentData.metadata.title && (
                                <p className="break-words">
                                  <span className="font-medium">Description:</span>{" "}
                                  {currentData.metadata.description}
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Transcription */}
                        {currentData.transcription &&
                          currentData.transcription.text &&
                          currentData.transcription.text.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <ShieldCheckIcon className="h-4 w-4" />
                                Transcription
                              </h4>
                              <div className="p-4 bg-muted rounded-lg">
                                <div className="text-sm leading-relaxed">
                                  <AnalysisRenderer
                                    content={currentData.transcription.text}
                                  />
                                </div>
                                {currentData.transcription.language && (
                                  <p className="text-xs text-muted-foreground mt-3">
                                    Language:{" "}
                                    {currentData.transcription.language}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Platform Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <AlertCircleIcon className="h-4 w-4" />
                            Platform Analysis
                          </h4>
                          <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Source Platform:</span>
                              <Badge variant="secondary">
                                {currentData.metadata.platform === "twitter"
                                  ? "Twitter/X"
                                  : "TikTok"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Content Type:</span>
                              <Badge variant="outline">
                                {currentData.metadata.platform === "twitter"
                                  ? "Social Post"
                                  : "Video Content"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                Fact-Check Required:
                              </span>
                              <Badge
                                variant={
                                  currentData.requiresFactCheck
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {currentData.requiresFactCheck ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* News Detection */}
                        {currentData.newsDetection && (
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <AlertCircleIcon className="h-4 w-4" />
                              Content Analysis
                            </h4>
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Content Type:</span>
                                <Badge
                                  variant={
                                    currentData.newsDetection.contentType ===
                                    "news_factual"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {currentData.newsDetection.contentType ===
                                  "news_factual"
                                    ? "News/Factual"
                                    : "Entertainment"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">
                                  Requires Fact-Check:
                                </span>
                                <Badge
                                  variant={
                                    currentData.requiresFactCheck
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {currentData.requiresFactCheck ? "Yes" : "No"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Confidence:</span>
                                <span className="text-sm font-medium">
                                  {Math.round(
                                    currentData.newsDetection.confidence * 100
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fact-Check Results */}
                        {currentData.factCheck && (
                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                              <ShieldCheckIcon className="h-4 w-4" />
                              Fact-Check Results
                            </h4>

                            {/* Overall Verification Status Summary */}
                            <Card
                              className={`border-l-4 shadow-sm ${
                                (
                                  currentData.factCheck as unknown as FactCheckResult
                                ).verdict === "verified"
                                  ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/10"
                                  : (
                                        currentData.factCheck as unknown as FactCheckResult
                                      ).verdict === "false"
                                    ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
                                    : (
                                          currentData.factCheck as unknown as FactCheckResult
                                        ).verdict === "misleading"
                                      ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10"
                                      : (
                                            currentData.factCheck as unknown as FactCheckResult
                                          ).verdict === "satire"
                                        ? "border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10"
                                        : "border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10"
                              }`}
                            >
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  {/* Header Section */}
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                                          {getStatusIcon(
                                            (
                                              currentData.factCheck as unknown as FactCheckResult
                                            ).verdict
                                          )}
                                        </div>
                                        <h5 className="font-semibold text-lg">
                                          {
                                            getVerdictDescription(
                                              (
                                                currentData.factCheck as unknown as FactCheckResult
                                              ).verdict,
                                              currentData.factCheck as unknown as FactCheckResult
                                            ).title
                                          }
                                        </h5>
                                      </div>
                                    </div>
                                    <div className="shrink-0 self-start">
                                      {getStatusBadge(
                                        (
                                          currentData.factCheck as unknown as FactCheckResult
                                        ).verdict
                                      )}
                                    </div>
                                  </div>

                                  {/* Analysis Description */}
                                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                      {
                                        getVerdictDescription(
                                          (
                                            currentData.factCheck as unknown as FactCheckResult
                                          ).verdict,
                                          currentData.factCheck as unknown as FactCheckResult
                                        ).description
                                      }
                                    </p>
                                  </div>

                                  {/* Metrics Section */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                          {
                                            (
                                              currentData.factCheck as unknown as FactCheckResult
                                            ).confidence
                                          }%
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Confidence</p>
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${(currentData.factCheck as unknown as FactCheckResult).confidence}%`
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                          {(
                                            currentData.factCheck as unknown as FactCheckResult
                                          ).sources?.length || 0}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Sources</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">Used for verification</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Origin Tracing Diagram - Moved here from detailed analysis */}
                            {((
                              currentData.factCheck as unknown as FactCheckResult
                            ).originTracing?.hypothesizedOrigin ||
                              originTracingData?.originTracing
                                ?.hypothesizedOrigin) && (
                              <div className="mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                  <h4 className="font-semibold text-lg">
                                    Origin Tracing & Belief Evolution
                                  </h4>
                                </div>
                                <div className="rounded-lg">
                                  <OriginTracingDiagram
                                    originTracing={
                                      originTracingData?.originTracing ||
                                      (
                                        currentData.factCheck as unknown as FactCheckResult
                                      ).originTracing
                                    }
                                    beliefDrivers={
                                      originTracingData?.beliefDrivers ||
                                      (
                                        currentData.factCheck as unknown as FactCheckResult
                                      ).beliefDrivers
                                    }
                                    sources={
                                      // Prioritize currentData.factCheck.sources for the diagram
                                      (currentData.factCheck as unknown as FactCheckResult)
                                        ?.sources?.map((source) => ({
                                          url: source.url,
                                          title: source.title,
                                          source: source.title || new URL(source.url).hostname,
                                          credibility: Math.round((source.credibility || 0.5) * 100), // Convert to percentage
                                        })) ||
                                      // Fallback to originTracingData.sources if no factCheck sources
                                      (originTracingData?.sources &&
                                      originTracingData?.sources.length > 0
                                        ? originTracingData.sources.map((source: any) => ({
                                            url: source.url,
                                            title: source.title,
                                            source: source.source || new URL(source.url).hostname,
                                            credibility: Math.round((source.credibility || 0.5) * 100),
                                          }))
                                        : [])
                                    }
                                    verdict={
                                      (
                                        currentData.factCheck as unknown as FactCheckResult
                                      ).verdict as
                                        | "verified"
                                        | "misleading"
                                        | "false"
                                        | "unverified"
                                        | "satire"
                                    }
                                    content={
                                      originTracingData?.claim ||
                                      (
                                        currentData.factCheck as unknown as FactCheckResult
                                      ).content
                                    }
                                    allLinks={
                                      originTracingData?.allLinks ||
                                      // Generate allLinks from currentData.factCheck.sources if not available
                                      (currentData.factCheck as unknown as FactCheckResult)
                                        ?.sources?.map((source) => ({
                                          url: source.url,
                                          title: source.title,
                                        }))
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {/* Expandable Detailed Analysis Section */}
                            <div className="mt-4">
                              <button
                                onClick={() =>
                                  setIsDetailedAnalysisExpanded(
                                    !isDetailedAnalysisExpanded
                                  )
                                }
                                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-base">
                                    View Detailed Analysis
                                  </span>
                                  {isDetailedAnalysisExpanded ? (
                                    <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Explore comprehensive analysis including
                                  sources, methodology, and detailed reasoning
                                </p>
                              </button>

                              {isDetailedAnalysisExpanded && (
                                <div className="mt-4 space-y-4 border-t pt-4">
                                  {/* Detailed Analysis Content */}
                                  {(
                                    currentData.factCheck as unknown as FactCheckResult
                                  ).explanation && (
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                      <p className="font-medium mb-3 text-base">
                                        Detailed Analysis:
                                      </p>
                                      <div>
                                        {(() => {
                                          const explanation = (
                                            currentData.factCheck as unknown as FactCheckResult
                                          ).explanation;
                                          const shouldTruncate =
                                            explanation.length > 500;

                                          const contentToShow =
                                            shouldTruncate &&
                                            !isAnalysisExpanded
                                              ? explanation.substring(0, 500) +
                                                "..."
                                              : explanation;

                                          return (
                                            <AnalysisRenderer
                                              content={contentToShow}
                                            />
                                          );
                                        })()}
                                      </div>
                                      {(() => {
                                        const explanation = (
                                          currentData.factCheck as unknown as FactCheckResult
                                        ).explanation;

                                        if (explanation.length <= 500)
                                          return null;

                                        return (
                                          <button
                                            onClick={() =>
                                              setIsAnalysisExpanded(
                                                !isAnalysisExpanded
                                              )
                                            }
                                            className="mt-4 text-primary hover:text-primary/80 font-medium transition-colors text-sm flex items-center gap-1"
                                          >
                                            {isAnalysisExpanded ? (
                                              <>
                                                <ChevronUpIcon className="h-4 w-4" />
                                                Show less analysis
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDownIcon className="h-4 w-4" />
                                                Show full analysis
                                              </>
                                            )}
                                          </button>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {/* Sources Section */}
                                  {(
                                    currentData.factCheck as unknown as FactCheckResult
                                  ).sources &&
                                    (
                                      currentData.factCheck as unknown as FactCheckResult
                                    ).sources.length > 0 && (
                                      <div>
                                        <p className="font-medium mb-3 text-base break-words">
                                          Sources Used in Analysis:
                                        </p>
                                        <p className="text-xs font-medium mb-2 text-muted-foreground">
                                          {
                                            (
                                              currentData.factCheck as unknown as FactCheckResult
                                            ).sources.length
                                          }{" "}
                                          sources found
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {(
                                            currentData.factCheck as unknown as FactCheckResult
                                          ).sources
                                            .slice(0, 10)
                                            .map((source, sourceIndex) => (
                                              <Button
                                                key={sourceIndex}
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="max-w-full"
                                              >
                                                <a
                                                  href={source.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs break-words text-left"
                                                  style={{ 
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    hyphens: 'auto'
                                                  }}
                                                >
                                                  <span className="truncate max-w-[200px] sm:max-w-none inline-block">
                                                    {source.title}
                                                  </span>
                                                  <ExternalLinkIcon className="h-3 w-3 ml-1 shrink-0" />
                                                </a>
                                              </Button>
                                            ))}
                                        </div>
                                      </div>
                                    )}

                                  {/* Belief Drivers - Text summary after diagram */}
                                    {(
                                      currentData.factCheck as unknown as FactCheckResult
                                    ).beliefDrivers &&
                                    (
                                      currentData.factCheck as unknown as FactCheckResult
                                    ).beliefDrivers!.length > 0 && (
                                      <div>
                                        <p className="font-medium mb-3 text-base">
                                          Why People Believe This:
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                            {(
                                              currentData.factCheck as unknown as FactCheckResult
                                            )
                                              .beliefDrivers!.slice(0, 10)
                                              .map((d, i) => (
                                                <li key={i}>
                                                  <span className="font-medium">
                                                    {d.name}:
                                                  </span>{" "}
                                                  {d.description}
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}

                                    {/* Political Bias Meter - Only for Malaysia Political Content */}
                                    {(currentData.factCheck as any)?.politicalBias?.isMalaysiaPolitical &&
                                      (currentData.factCheck as any)?.politicalBias?.malaysiaBiasScore !== undefined && (
                                        <div className="mt-4">
                                          <PoliticalBiasMeter
                                            biasScore={(currentData.factCheck as any).politicalBias.malaysiaBiasScore}
                                            explanation={(currentData.factCheck as any).politicalBias.explanation}
                                            keyQuote={(currentData.factCheck as any).politicalBias.keyQuote}
                                            confidence={(currentData.factCheck as any).politicalBias.confidence}
                                            biasIndicators={(currentData.factCheck as any).politicalBias.biasIndicators}
                                            politicalTopics={(currentData.factCheck as any).politicalBias.politicalTopics}
                                          />
                                        </div>
                                      )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-4 border-t">
                          <div className="flex gap-3 flex-wrap">
                            {/* Save Button - Only show for authenticated users */}
                            {isSignedIn && (
                              <Button
                                onClick={handleSaveAnalysis}
                                disabled={isSaving || isSaved}
                                className="flex items-center gap-2"
                              >
                                {isSaving ? (
                                  <LoaderIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <BookmarkIcon className="h-4 w-4" />
                                )}
                                {isSaved
                                  ? t.saved
                                  : isSaving
                                    ? t.saving
                                    : t.saveAnalysis}
                              </Button>
                            )}

                            {/* Download after save */}
                            {isSignedIn && isSaved && savedId && (
                              <Button asChild variant="outline">
                                <a
                                  href={`/api/analyses/${encodeURIComponent(savedId)}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download JSON
                                </a>
                              </Button>
                            )}

                            <Button variant="outline" onClick={handleReset}>
                              {t.reset}
                            </Button>
                          </div>

                          {/* Login prompt for non-authenticated users */}
                          {!isSignedIn && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <Link
                                href="/sign-in"
                                className="text-primary hover:underline"
                              >
                                Sign in
                              </Link>{" "}
                              to save your analysis results
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-left">
                    <p className="text-red-500 mb-4">{result?.error}</p>
                    <Button variant="outline" onClick={handleReset}>
                      {t.tryAgain}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

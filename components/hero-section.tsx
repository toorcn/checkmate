"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// no extra inputs; reuse existing UrlInputForm
import { useTikTokAnalysis } from "@/lib/hooks/use-tiktok-analysis";
import { useSaveTikTokAnalysisWithCredibility } from "@/lib/hooks/use-saved-analyses";
import { useAnimatedProgress } from "@/lib/hooks/use-animated-progress";
import { toast } from "sonner";
import { useGlobalTranslation } from "@/components/global-translation-provider";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  UrlInputForm,
  LoadingOverlay,
  ResultsSection,
} from "@/components/hero";
import { AnalysisData, MockResult } from "@/types/analysis";
import { parseMarkdownToJSX } from "@/lib/analysis/markdown-parser";

interface HeroSectionProps {
  initialUrl?: string;
  variant?: "default" | "dashboard";
}


export function HeroSection({ initialUrl = "", variant = "default" }: HeroSectionProps) {
  const [url, setUrl] = useState(initialUrl);
  const [chatMode, setChatMode] = useState(false);
  const [forceChat, setForceChat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [mockResult, setMockResult] = useState<MockResult | null>(null);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const { analyzeTikTok, isLoading, result, reset } = useTikTokAnalysis();
  const {
    progress,
    isAnimating,
    startProgress,
    resetProgress,
  } = useAnimatedProgress({ duration: 20000 });
  const { user } = useAuth();
  const isSignedIn = !!user;

  const saveTikTokAnalysisWithCredibility = useSaveTikTokAnalysisWithCredibility();
  const router = useRouter();
  const { t, translateCurrentPage, enableAutoTranslation, language } = useGlobalTranslation();

  const [phase, setPhase] = useState<string>("");

  // Chat hook (AI SDK v4) - using manual message management
  const [manualChatMessages, setManualChatMessages] = useState<any[]>([]);
  const [manualChatStatus, setManualChatStatus] = useState<string>('ready');
  const [manualChatError, setManualChatError] = useState<any>(null);
  const [chatInput, setChatInput] = useState<string>("");

  const sendManualChatMessage = async (message: { role: string; content: string }) => {
    try {
      setManualChatStatus('streaming');
      setManualChatError(null);
      
      // Add user message immediately
      const userMsg = { ...message, id: Date.now().toString() };
      setManualChatMessages(prev => [...prev, userMsg]);
      
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...manualChatMessages, userMsg] }),
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      // Read stream (AI SDK Data Stream Protocol)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMsg = { role: 'assistant', content: '', id: (Date.now() + 1).toString() };

      setManualChatMessages(prev => [...prev, assistantMsg]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          // Handle AI SDK Data Stream Protocol lines: "data: {json}"
          if (line.startsWith('data: ')) {
            let payload: any = null;
            try {
              payload = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            const type = payload?.type;
            // Append incremental text
            if (type === 'text-delta' && typeof payload.delta === 'string') {
              assistantContent += payload.delta;
              setManualChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMsg, content: assistantContent };
                return updated;
              });
            }

            // Some providers may send full text blocks
            if (type === 'message' && typeof payload.text === 'string') {
              assistantContent += payload.text;
              setManualChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMsg, content: assistantContent };
                return updated;
              });
            }

            // End of stream marker
            if (type === 'done') {
              break;
            }
          }

          // Backward compatibility for old "0:" text stream lines
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              assistantContent += text;
              setManualChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMsg, content: assistantContent };
                return updated;
              });
            } catch {}
          }
        }
      }
      
      setManualChatStatus('ready');
    } catch (err) {
      console.error('[sendManualChatMessage] error:', err);
      setManualChatError(err);
      setManualChatStatus('ready');
    }
  };
  
  const chatMessages = manualChatMessages;
  const chatStatus = manualChatStatus;
  const chatError = manualChatError;
  const sendChatMessage = sendManualChatMessage;
  
  console.log('[Chat] Manual state - messages:', chatMessages.length, 'status:', chatStatus);

  // Loading phase label derived from progress
  useEffect(() => {
    if (!isAnimating) return;
    const pct = Math.round(progress);
    if (pct < 30) setPhase("Transcribing media");
    else if (pct < 60) setPhase("Detecting news content");
    else if (pct < 85) setPhase("Fact-checking claims");
    else setPhase("Building origin tracing & credibility");
  }, [progress, isAnimating]);

  const buildSummaryText = (data: AnalysisData | any) => {
    try {
      const fc = data?.factCheck;
      const title = data?.metadata?.title || "Checkmate Analysis";
      const verdict = fc?.verdict ? `Verdict: ${fc.verdict}` : "";
      const confidence = fc?.confidence != null ? `Confidence: ${fc.confidence}%` : "";
      const summary = fc ? getAnalysisSummary(fc) : data?.newsDetection?.contentType || "";
      const link = data?.metadata?.originalUrl || "";
      return [title, verdict, confidence, summary, link].filter(Boolean).join("\n");
    } catch {
      return "Checkmate analysis summary";
    }
  };

  const getAnalysisSummary = (factCheck: any) => {
    if (factCheck.explanation) {
      const paragraphs = factCheck.explanation
        .split("\n")
        .filter((p: string) => p.trim().length > 50);
      if (paragraphs.length > 0) {
        const firstParagraph = paragraphs[0].trim();
        if (firstParagraph.length > 300) {
          const sentences = firstParagraph.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
          if (sentences.length > 1) {
            const summary = sentences.slice(0, Math.min(3, sentences.length)).join('. ');
            return summary + (sentences.length > 3 ? '.' : '');
          }
        }
        return firstParagraph;
      }
    }
    if (factCheck.content) {
      const cleanContent = factCheck.content.trim();
      return cleanContent.length > 200
        ? cleanContent.substring(0, 200) + "..."
        : cleanContent;
    }
    return "Analysis summary is being generated based on credible sources and fact-checking methodology.";
  };

  const handleCopySummary = async () => {
    const dataSource = result?.success && result.data ? result.data : mockResult?.success && mockResult.data ? mockResult.data : null;
    if (!dataSource) return;
    try {
      await navigator.clipboard.writeText(buildSummaryText(dataSource));
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Failed to copy summary");
    }
  };

  const handleShare = async () => {
    const dataSource = result?.success && result.data ? result.data : mockResult?.success && mockResult.data ? mockResult.data : null;
    if (!dataSource) return;
    const text = buildSummaryText(dataSource);
    const shareUrl = dataSource?.metadata?.originalUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Checkmate Analysis", text, url: shareUrl });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      toast.success("Share text copied to clipboard");
    } catch {
      toast.error("Failed to share");
    }
  };

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (result) {
      if (result.success) {
        setIsInputExpanded(false); // Collapse input when results are shown
        // Trigger translation if auto-translation is enabled and language is not English
        if (enableAutoTranslation && language !== "en") {
          // Small delay to allow DOM to update with new content
          setTimeout(() => {
            translateCurrentPage();
          }, 500);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    }
  }, [result, t, enableAutoTranslation, language, translateCurrentPage]);

  const isProbablyUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
      // Allow missing scheme by trying to prepend https
      // If it parses as URL with a hostname and a dot, treat as URL
      const candidate = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
      const u = new URL(candidate);
      return Boolean(u.hostname && u.hostname.includes("."));
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    console.log('[handleAnalyze] Called with url:', url, 'forceChat:', forceChat);
    
    if (!url.trim()) {
      toast.error(t.enterUrl);
      return;
    }

    const isUrl = isProbablyUrl(url);
    console.log('[handleAnalyze] isProbablyUrl:', isUrl, 'forceChat:', forceChat);

    if (forceChat || !isUrl) {
      // Switch to chat mode and send the user's message
      console.log('[handleAnalyze] Entering chat mode, sending message');
      setChatMode(true);
      setIsInputExpanded(false);
      const content = url.trim();
      try {
        console.log('[handleAnalyze] Calling sendChatMessage with:', { role: 'user', content });
        await sendChatMessage({ role: 'user', content });
        console.log('[handleAnalyze] sendChatMessage completed');
      } catch (e) {
        console.error('[handleAnalyze] sendChatMessage error:', e);
        toast.error("Failed to start chat");
      }
      return;
    }

    // URL flow (existing behavior)
    const params = new URLSearchParams();
    params.set("link", url.trim());
    router.replace(`?${params.toString()}`);

    toast.info(t.analysisStarted);
    startProgress();
    await analyzeTikTok(url.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[handleSubmit] Form submitted, calling handleAnalyze');
    await handleAnalyze();
  };

  const handleReset = () => {
    setUrl("");
    setChatMode(false);
    setForceChat(false);
    setIsSaved(false);
    setSavedId(null);
    setMockResult(null);
    setIsInputExpanded(true);
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
    startProgress();

    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate realistic mock data matching current API structure
    const mockData: MockResult = {
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
    setIsInputExpanded(false); // Collapse input when mock results are shown
    toast.success("Mock Analysis Complete! (No API costs incurred)");
    
    // Trigger translation if auto-translation is enabled and language is not English
    if (enableAutoTranslation && language !== "en") {
      // Small delay to allow DOM to update with new content
      setTimeout(() => {
        translateCurrentPage();
      }, 500);
    }
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

    if (isSaved) {
      toast.info(t.alreadySaved);
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        videoUrl: dataSource.metadata.originalUrl,
        transcription: dataSource.transcription
          ? {
              text: dataSource.transcription.text,
              language: dataSource.transcription.language,
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
              verdict: (dataSource.factCheck as any).verdict,
              confidence: (dataSource.factCheck as any).confidence,
              explanation: (dataSource.factCheck as any).explanation,
              content: (dataSource.factCheck as any).content,
              originTracing: (dataSource.factCheck as any).originTracing,
              beliefDrivers: (dataSource.factCheck as any).beliefDrivers,
              sources: (dataSource.factCheck as any).sources?.map((source: any) => ({
                title: source.title,
                url: source.url,
                source: source.title,
                relevance: source.credibility || source.relevance || 0.5,
              })),
            }
          : undefined,
        requiresFactCheck: dataSource.requiresFactCheck,
        creatorCredibilityRating:
          dataSource.creatorCredibilityRating == null
            ? 5
            : Math.round(Number(dataSource.creatorCredibilityRating)),
        contentCreatorId: dataSource.metadata?.creator,
      };

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


  const isDashboard = variant === "dashboard";

  return (
    <section className={`${isDashboard ? "py-6 md:py-8" : "py-24 md:py-32"} relative`}>
      {!chatMode && (
        <LoadingOverlay
          isLoading={isLoading}
          isMockLoading={isMockLoading}
          progress={progress}
          phase={phase}
        />
      )}
      
      <div className={`text-center transition-all duration-500 ${!isInputExpanded && (result?.success || mockResult?.success) ? 'mb-8' : ''}`}>
        {!isDashboard && (
          <>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              {t.heroTitle}
            </h1>
            {(!(!isInputExpanded && (result?.success || mockResult?.success))) && (
              <>
                <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
                  AI-Powered Fact Checking
                </Badge>
                <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                  {t.heroSubtitle}
                </p>
              </>
            )}
          </>
        )}

        {(!isDashboard && !isInputExpanded && (result?.success || mockResult?.success || chatMode)) ? (
          <div className="flex justify-center">
            <Button 
              onClick={() => setIsInputExpanded(true)}
              variant="outline"
              className="gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Analysis
            </Button>
          </div>
        ) : (
          <>
            {!chatMode && (
              <UrlInputForm
                url={url}
                setUrl={setUrl}
                isLoading={isLoading}
                isMockLoading={isMockLoading}
                onSubmit={handleSubmit}
                onMockAnalysis={handleMockAnalysis}
                compact={isDashboard}
                allowNonUrl={forceChat}
                forceChat={forceChat}
                onToggleChat={() => setForceChat(!forceChat)}
                hideExtras={
                  chatMode ||
                  isLoading ||
                  isMockLoading ||
                  Boolean(result?.success) ||
                  Boolean(mockResult?.success) ||
                  manualChatMessages.length > 0 ||
                  manualChatStatus === 'streaming'
                }
              />
            )}
          </>
        )}
      </div>

      {chatMode ? (
        <div className="mx-auto mt-6 max-w-3xl pb-28">
          <div className="space-y-4 rounded-lg p-4 bg-transparent">
            {chatMessages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask about current news. We will cite sources when available.</p>
            )}
            {chatMessages.map((m: any, i: number) => {
              console.log('[Chat UI] Rendering message:', i, m);
              return (
                <div key={m.id || i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div className={`inline-block rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.role === 'user'
                      ? (m.content || '(empty)')
                      : (parseMarkdownToJSX(m.content || '')?.length
                          ? parseMarkdownToJSX(m.content || '')
                          : (m.content || '(empty)'))}
                  </div>
                </div>
              );
            })}
          </div>
          {chatError && <p className="mt-2 text-sm text-red-500">{String(chatError)}</p>}
          {/* Fixed bottom input bar for chat - reuse the same UrlInputForm */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-3xl px-4 py-3">
              <UrlInputForm
                url={chatInput}
                setUrl={setChatInput}
                isLoading={manualChatStatus === 'streaming'}
                isMockLoading={false}
                onSubmit={async (e: React.FormEvent) => {
                  e.preventDefault();
                  const content = chatInput.trim();
                  if (!content || manualChatStatus === 'streaming') return;
                  try {
                    await sendChatMessage({ role: 'user', content });
                    setChatInput("");
                  } catch (err) {
                    console.error('[Chat Input] send error', err);
                  }
                }}
                onMockAnalysis={() => {}}
                compact
                allowNonUrl
                forceChat
                onToggleChat={() => {}}
                hideExtras
              />
            </div>
          </div>
        </div>
      ) : (
        <ResultsSection
          result={result as any}
          mockResult={mockResult}
          isSignedIn={isSignedIn}
          isSaving={isSaving}
          isSaved={isSaved}
          savedId={savedId}
          onSaveAnalysis={handleSaveAnalysis}
          onCopySummary={handleCopySummary}
          onShare={handleShare}
          onReset={handleReset}
        />
      )}
    </section>
  );
}

"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  XCircleIcon,
  SmileIcon,
  SearchIcon,
  BrainIcon,
  BarChart3Icon,
  FileTextIcon,
} from "lucide-react";
import { OriginTracingDiagram } from "@/components/analysis/origin-tracing-diagram";
import { SentimentDisplay } from "@/components/analysis/sentiment-display";
import { PoliticalBiasMeter } from "@/components/ui/political-bias-meter";
import { FactCheckResult, AnalysisData } from "@/types/analysis";
import {
  VerdictOverviewCard,
  AnalysisOverviewCard,
  MetricsOverviewCard,
} from "./analysis-overview-cards";
import {
  AnalysisDetailModal,
  VerdictDetailContent,
  SourcesDetailContent,
  BeliefDriversDetailContent,
} from "./analysis-detail-modal";

interface FactCheckDisplayProps {
  factCheck: any;
  originTracingData?: any;
  currentData: any;
}

export function FactCheckDisplay({
  factCheck,
  originTracingData,
  currentData,
}: FactCheckDisplayProps) {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const verdictDetailRef = useRef<HTMLDivElement>(null);

  const scrollToVerdictDetail = () => {
    verdictDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Normalize various backend verdict strings to a canonical set used by UI
  const normalizeVerdict = (status: string | undefined | null): "verified" | "false" | "misleading" | "unverified" | "satire" | "partially_true" | "outdated" | "exaggerated" | "opinion" | "rumor" | "conspiracy" | "debunked" => {
    const value = (status || "").toString().trim().toLowerCase();
    if (value === "true" || value === "verified") return "verified";
    if (value === "false") return "false";
    if (value === "misleading") return "misleading";
    if (value === "unverified" || value === "unverifiable") return "unverified";
    if (value === "satire") return "satire";
    if (value === "partially_true") return "partially_true";
    if (value === "outdated") return "outdated";
    if (value === "exaggerated") return "exaggerated";
    if (value === "opinion") return "opinion";
    if (value === "rumor") return "rumor";
    if (value === "conspiracy") return "conspiracy";
    if (value === "debunked") return "debunked";
    return "unverified";
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
      case "unverifiable":
        return <AlertCircleIcon className="h-4 w-4 text-gray-500" />;
      case "satire":
        return <span className="text-purple-500 text-sm">🎭</span>;
      case "partially_true":
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />;
      case "outdated":
        return <AlertCircleIcon className="h-4 w-4 text-gray-600" />;
      case "exaggerated":
        return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
      case "opinion":
        return <AlertCircleIcon className="h-4 w-4 text-blue-500" />;
      case "rumor":
        return <AlertCircleIcon className="h-4 w-4 text-gray-400" />;
      case "conspiracy":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case "debunked":
        return <XCircleIcon className="h-4 w-4 text-red-700" />;
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
      case "unverifiable":
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
      case "partially_true":
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Partially True
          </Badge>
        );
      case "outdated":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Outdated Information
          </Badge>
        );
      case "exaggerated":
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Exaggerated Claims
          </Badge>
        );
      case "opinion":
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Opinion
          </Badge>
        );
      case "rumor":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Rumor
          </Badge>
        );
      case "conspiracy":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Conspiracy Theory
          </Badge>
        );
      case "debunked":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Debunked
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
      case "partially_true":
        return {
          title: "Partially True",
          description:
            analysisDescription ||
            "This content contains both accurate and inaccurate elements. Some claims are supported by evidence while others are not.",
        };
      case "outdated":
        return {
          title: "Outdated Information",
          description:
            analysisDescription ||
            "This information was accurate at one time but has been superseded by newer evidence or developments.",
        };
      case "exaggerated":
        return {
          title: "Exaggerated Claims",
          description:
            analysisDescription ||
            "While based on some truth, this content overstates or sensationalizes the facts beyond what evidence supports.",
        };
      case "opinion":
        return {
          title: "Opinion",
          description:
            analysisDescription ||
            "This content expresses subjective views or personal beliefs rather than factual claims that can be verified.",
        };
      case "rumor":
        return {
          title: "Rumor",
          description:
            analysisDescription ||
            "This appears to be unverified information circulating without credible sources or confirmation.",
        };
      case "conspiracy":
        return {
          title: "Conspiracy Theory",
          description:
            analysisDescription ||
            "This content involves claims about secret plots or hidden agendas without credible evidence to support them.",
        };
      case "debunked":
        return {
          title: "Debunked",
          description:
            analysisDescription ||
            "This claim has been thoroughly disproven by multiple credible sources and scientific evidence.",
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
    <div className="space-y-6">
      <h4 className="font-medium flex items-center gap-2">
        <ShieldCheckIcon className="h-5 w-5" />
        Fact-Check Analysis
      </h4>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verdict Overview Card */}
        <div className="md:col-span-2">
          <VerdictOverviewCard
            verdict={normalizeVerdict(factCheck.verdict)}
            confidence={factCheck.confidence}
            description={getVerdictDescription(factCheck.verdict, factCheck).description}
            icon={getStatusIcon(normalizeVerdict(factCheck.verdict))}
            badge={getStatusBadge(normalizeVerdict(factCheck.verdict))}
            onClick={scrollToVerdictDetail}
          />
        </div>

        {/* Metrics Card */}
        <MetricsOverviewCard
          confidence={factCheck.confidence}
          sourcesCount={factCheck.sources?.length || 0}
          onClick={() => setOpenModal("metrics")}
        />

        {/* Sentiment Analysis Card */}
        {factCheck.sentimentAnalysis && (() => {
          const sentiment = (factCheck.sentimentAnalysis.overall || "NEUTRAL").toUpperCase();
          const emotionalIntensity = factCheck.sentimentAnalysis.emotionalIntensity || 0;
          const scores = factCheck.sentimentAnalysis.scores || {};
          const flags = factCheck.sentimentAnalysis.flags || [];
          const keyPhrases = factCheck.sentimentAnalysis.keyPhrases || [];
          const manipulationTactics = factCheck.sentimentAnalysis.manipulationTactics || [];
          const credibilityImpact = factCheck.sentimentAnalysis.credibilityImpact;
          const targetEmotions = factCheck.sentimentAnalysis.targetEmotions || [];
          const linguisticRedFlags = factCheck.sentimentAnalysis.linguisticRedFlags || [];
          
          const getSentimentVariant = () => {
            // If high emotional intensity or manipulation detected, show as warning/danger
            if (emotionalIntensity > 0.7 || manipulationTactics.length > 0) {
              return "danger";
            }
            switch (sentiment) {
              case "POSITIVE":
                return scores.positive > 0.85 ? "warning" : "success";
              case "NEGATIVE":
                return "danger";
              case "MIXED":
                return "warning";
              default:
                return "info";
            }
          };
          const getSentimentIconColor = () => {
            if (emotionalIntensity > 0.7 || manipulationTactics.length > 0) {
              return "text-red-600 dark:text-red-400";
            }
            switch (sentiment) {
              case "POSITIVE":
                return scores.positive > 0.85 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400";
              case "NEGATIVE":
                return "text-red-600 dark:text-red-400";
              case "MIXED":
                return "text-yellow-600 dark:text-yellow-400";
              default:
                return "text-blue-600 dark:text-blue-400";
            }
          };
          
          // Find the dominant score
          const dominantScore = Math.max(
            scores.positive || 0,
            scores.negative || 0,
            scores.neutral || 0,
            scores.mixed || 0
          );
          const scorePercentage = Math.round(dominantScore * 100);
          const intensityLabel = emotionalIntensity > 0.7 ? "High" : emotionalIntensity > 0.4 ? "Moderate" : "Low";
          
          const getDescription = () => {
            // Prioritize showing manipulation tactics or credibility impact
            if (manipulationTactics.length > 0) {
              const tacticCount = manipulationTactics.length;
              const primaryTactic = manipulationTactics[0].tactic;
              return `⚠️ ${tacticCount} manipulation tactic${tacticCount > 1 ? 's' : ''} detected: ${primaryTactic}`;
            }
            
            if (credibilityImpact && credibilityImpact.modifier < 1.0) {
              const impactPercent = Math.round((1 - credibilityImpact.modifier) * 100);
              return `⚠️ Reduces credibility by ${impactPercent}% due to emotional manipulation`;
            }
            
            if (linguisticRedFlags.length >= 3) {
              return `⚠️ ${linguisticRedFlags.length} linguistic red flags detected`;
            }
            
            if (targetEmotions.length > 0) {
              const emotionList = targetEmotions.slice(0, 2).join(", ");
              return `Targets emotions: ${emotionList} • ${intensityLabel} intensity`;
            }
            
            // Default description
            const sentimentLabel = sentiment.charAt(0) + sentiment.slice(1).toLowerCase();
            const parts = [
              `${sentimentLabel} (${scorePercentage}%)`,
              `${intensityLabel} intensity`
            ];
            
            // Add flag or key phrase
            if (flags.length > 0) {
              const flagLabel = flags[0].replace(/_/g, ' ').toLowerCase();
              parts.push(flagLabel.charAt(0).toUpperCase() + flagLabel.slice(1));
            }
            
            return parts.join(' • ');
          };
          
          return (
            <AnalysisOverviewCard
              title="Sentiment Analysis"
              description={getDescription()}
              icon={<BarChart3Icon className={`h-5 w-5 ${getSentimentIconColor()}`} />}
              onClick={() => setOpenModal("sentiment")}
              variant={getSentimentVariant()}
            />
          );
        })()}

        {/* Belief Drivers Card */}
        {((factCheck.beliefDrivers && factCheck.beliefDrivers.length > 0) || 
          (originTracingData?.beliefDrivers && originTracingData.beliefDrivers.length > 0)) && (
          <AnalysisOverviewCard
            title="Belief Drivers"
            description="Psychological factors influencing belief in this content"
            icon={<BrainIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            onClick={() => setOpenModal("beliefDrivers")}
            variant="info"
            metric={{
              value: (originTracingData?.beliefDrivers || factCheck.beliefDrivers)?.length || 0,
              label: "factors",
            }}
          />
        )}

        {/* Sources Card */}
        {factCheck.sources && factCheck.sources.length > 0 && (
          <AnalysisOverviewCard
            title="Sources & Evidence"
            description={`${factCheck.sources.length} credible sources analyzed for verification`}
            icon={<FileTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
            onClick={() => setOpenModal("sources")}
            variant="success"
            metric={{
              value: factCheck.sources.length,
              label: "sources",
            }}
          />
        )}
      </div>

      {/* Political Bias Card - Only for Malaysia Political Content */}
      {(currentData.factCheck as any)?.politicalBias?.isMalaysiaPolitical &&
        (currentData.factCheck as any)?.politicalBias?.malaysiaBiasScore !== undefined && (
          <AnalysisOverviewCard
            title="Political Bias Analysis"
            description="Analysis of political leaning in Malaysian context"
            icon={<BarChart3Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            onClick={() => setOpenModal("politicalBias")}
            variant="info"
          />
        )}

      {/* Origin Tracing Section - Full Display */}
      {(factCheck.originTracing?.hypothesizedOrigin ||
        originTracingData?.originTracing?.hypothesizedOrigin) && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <h4 className="font-semibold text-lg">
              Origin Tracing & Belief Evolution
            </h4>
          </div>
          <div className="rounded-lg">
            <OriginTracingDiagram
              key={openModal ? 'modal-open' : 'modal-closed'}
              originTracing={
                originTracingData?.originTracing || factCheck.originTracing
              }
              beliefDrivers={
                originTracingData?.beliefDrivers || factCheck.beliefDrivers
              }
              sources={
                factCheck.sources?.map((source: any) => ({
                  url: source.url,
                  title: source.title,
                  source: source.title || new URL(source.url).hostname,
                  credibility: Math.round((source.credibility || 0.5) * 100),
                })) ||
                (originTracingData?.sources && originTracingData?.sources.length > 0
                  ? originTracingData.sources.map((source: any) => ({
                      url: source.url,
                      title: source.title,
                      source: source.source || new URL(source.url).hostname,
                      credibility: Math.round((source.credibility || 0.5) * 100),
                    }))
                  : [])
              }
              verdict={factCheck.verdict}
              content={originTracingData?.claim || factCheck.content}
              allLinks={
                originTracingData?.allLinks ||
                factCheck.sources?.map((source: any) => ({
                  url: source.url,
                  title: source.title,
                }))
              }
            />
          </div>
        </div>
      )}

      {/* Verdict Detail Section - Displayed below graph */}
      <div ref={verdictDetailRef} className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
          <h4 className="font-semibold text-lg">
            Verification Status Details
          </h4>
        </div>
        <Card className="border-2">
          <CardContent className="p-6">
            <VerdictDetailContent
              verdict={normalizeVerdict(factCheck.verdict)}
              confidence={factCheck.confidence}
              description={getVerdictDescription(factCheck.verdict, factCheck).description}
              explanation={factCheck.explanation}
              statusIcon={getStatusIcon(normalizeVerdict(factCheck.verdict))}
              statusBadge={getStatusBadge(normalizeVerdict(factCheck.verdict))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detail Modals */}
      <AnalysisDetailModal
        isOpen={openModal === "metrics"}
        onClose={() => setOpenModal(null)}
        title="Analysis Metrics"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Confidence Level
              </h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {factCheck.confidence}%
                </span>
              </div>
              <div className="mt-3 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${factCheck.confidence}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Based on source credibility and evidence strength
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                Sources Analyzed
              </h4>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {factCheck.sources?.length || 0}
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                Credible sources verified for accuracy
              </p>
            </div>
          </div>
        </div>
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "sources"}
        onClose={() => setOpenModal(null)}
        title="Sources & Evidence"
      >
        {factCheck.sources && factCheck.sources.length > 0 && (
          <SourcesDetailContent sources={factCheck.sources} />
        )}
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "beliefDrivers"}
        onClose={() => setOpenModal(null)}
        title="Why People Believe This"
      >
        {((factCheck.beliefDrivers && factCheck.beliefDrivers.length > 0) || 
          (originTracingData?.beliefDrivers && originTracingData.beliefDrivers.length > 0)) && (
          <BeliefDriversDetailContent 
            beliefDrivers={originTracingData?.beliefDrivers || factCheck.beliefDrivers} 
          />
        )}
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "sentiment"}
        onClose={() => setOpenModal(null)}
        title="Sentiment Analysis"
      >
        {factCheck.sentimentAnalysis && (
          <SentimentDisplay 
            sentiment={factCheck.sentimentAnalysis} 
            verdict={factCheck.verdict}
          />
        )}
      </AnalysisDetailModal>

      <AnalysisDetailModal
        isOpen={openModal === "politicalBias"}
        onClose={() => setOpenModal(null)}
        title="Political Bias Analysis"
      >
        {(currentData.factCheck as any)?.politicalBias?.isMalaysiaPolitical &&
          (currentData.factCheck as any)?.politicalBias?.malaysiaBiasScore !== undefined && (
            <PoliticalBiasMeter
              biasScore={(currentData.factCheck as any).politicalBias.malaysiaBiasScore}
              explanation={(currentData.factCheck as any).politicalBias.explanation}
              keyQuote={(currentData.factCheck as any).politicalBias.keyQuote}
              confidence={(currentData.factCheck as any).politicalBias.confidence}
              biasIndicators={(currentData.factCheck as any).politicalBias.biasIndicators}
              politicalTopics={(currentData.factCheck as any).politicalBias.politicalTopics}
            />
          )}
      </AnalysisDetailModal>
    </div>
  );
}

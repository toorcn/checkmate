"use client";

import { useState } from "react";
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
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { AnalysisRenderer } from "@/components/analysis-renderer";
import { OriginTracingDiagram } from "@/components/analysis/origin-tracing-diagram";
import { SentimentDisplay } from "@/components/analysis/sentiment-display";
import { PoliticalBiasMeter } from "@/components/ui/political-bias-meter";
import { FactCheckResult, AnalysisData } from "@/types/analysis";

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
  const [isDetailedAnalysisExpanded, setIsDetailedAnalysisExpanded] = useState(false);

  // Normalize various backend verdict strings to a canonical set used by UI
  const normalizeVerdict = (status: string | undefined | null): "verified" | "false" | "misleading" | "unverified" | "satire" => {
    const value = (status || "").toString().trim().toLowerCase();
    if (value === "true" || value === "verified") return "verified";
    if (value === "false") return "false";
    if (value === "misleading") return "misleading";
    if (value === "unverified" || value === "unverifiable") return "unverified";
    if (value === "satire") return "satire";
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
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <ShieldCheckIcon className="h-4 w-4" />
        Fact-Check Results
      </h4>

      {/* Overall Verification Status Summary */}
      <Card
        className={`border-l-4 shadow-sm ${
          factCheck.verdict === "verified"
            ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/10"
            : factCheck.verdict === "false"
              ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
              : factCheck.verdict === "misleading"
                ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10"
                : factCheck.verdict === "satire"
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
                    {getStatusIcon(normalizeVerdict(factCheck.verdict))}
                  </div>
                  <h5 className="font-semibold text-lg">
                    {getVerdictDescription(factCheck.verdict, factCheck).title}
                  </h5>
                </div>
              </div>
              <div className="shrink-0 self-start">
                {getStatusBadge(normalizeVerdict(factCheck.verdict))}
              </div>
            </div>

            {/* Analysis Description */}
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {getVerdictDescription(factCheck.verdict, factCheck).description}
              </p>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {factCheck.confidence}%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Confidence</p>
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${factCheck.confidence}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {factCheck.sources?.length || 0}
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

      {/* Sentiment Analysis Section */}
      {factCheck.sentimentAnalysis && (
        <div className="mt-6">
          <SentimentDisplay sentiment={factCheck.sentimentAnalysis} />
        </div>
      )}

      {/* Origin Tracing Diagram */}
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

      {/* Expandable Detailed Analysis Section */}
      <div className="mt-4">
        <button
          onClick={() =>
            setIsDetailedAnalysisExpanded(!isDetailedAnalysisExpanded)
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
            {factCheck.explanation && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="font-medium mb-3 text-base">
                  Detailed Analysis:
                </p>
                <div>
                  <AnalysisRenderer content={factCheck.explanation} />
                </div>
              </div>
            )}

            {/* Sources Section */}
            {factCheck.sources && factCheck.sources.length > 0 && (
              <div>
                <p className="font-medium mb-3 text-base break-words">
                  Sources Used in Analysis:
                </p>
                <p className="text-xs font-medium mb-2 text-muted-foreground">
                  {factCheck.sources.length} sources found
                </p>
                <div className="flex flex-wrap gap-2">
                  {factCheck.sources
                    .slice(0, 10)
                    .map((source: any, sourceIndex: any) => (
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
            {factCheck.beliefDrivers && factCheck.beliefDrivers.length > 0 && (
              <div>
                <p className="font-medium mb-3 text-base">
                  Why People Believe This:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {factCheck.beliefDrivers.slice(0, 10).map((d: any, i: any ) => (
                      <li key={i}>
                        <span className="font-medium">{d.name}:</span>{" "}
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
  );
}

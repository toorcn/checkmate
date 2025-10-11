"use client";

import { useState } from "react";
import { useTikTokAnalysisById } from "@/lib/hooks/use-saved-analyses";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  ClipboardCheck,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalysisRenderer } from "@/components/analysis-renderer";
import { OriginTracingDiagram } from "@/components/analysis/origin-tracing-diagram";
import { CreatorCredibilityDisplay } from "@/components/creator-credibility-display";
import { SentimentDisplay } from "@/components/analysis/sentiment-display";
import { useLanguage } from "@/components/global-translation-provider";
import { PoliticalBiasMeter } from "@/components/ui/political-bias-meter";
import { FactCheckDisplay } from "@/components/hero/fact-check-display";
import { MetadataDisplay } from "@/components/hero/metadata-display";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "verified":
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case "true":
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case "false":
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    case "misleading":
      return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
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
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    case "true":
      return (
        <Badge className="bg-green-100 text-green-800">Verified True</Badge>
      );
    case "false":
      return <Badge className="bg-red-100 text-red-800">False</Badge>;
    case "misleading":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Misleading</Badge>
      );
    case "unverifiable":
      return (
        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          Unverifiable
        </Badge>
      );
    case "satire":
      return (
        <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
          Satire
        </Badge>
      );
    case "partially_true":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Partially True</Badge>
      );
    case "outdated":
      return (
        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          Outdated
        </Badge>
      );
    case "exaggerated":
      return (
        <Badge className="bg-orange-100 text-orange-800">Exaggerated</Badge>
      );
    case "opinion":
      return (
        <Badge className="bg-blue-100 text-blue-800">Opinion</Badge>
      );
    case "rumor":
      return (
        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          Rumor
        </Badge>
      );
    case "conspiracy":
      return (
        <Badge className="bg-red-100 text-red-800">Conspiracy</Badge>
      );
    case "debunked":
      return (
        <Badge className="bg-red-100 text-red-800">Debunked</Badge>
      );
    default:
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          Needs Verification
        </Badge>
      );
  }
};

export function AnalysisPage({ analysisId }: { analysisId: string }) {
  const { t } = useLanguage();
  const analysis = useTikTokAnalysisById(analysisId);
  const [expandedClaims, setExpandedClaims] = useState<Record<number, boolean>>(
    {}
  );
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (analysis === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold">{t.loadingAnalysis}</h1>
          <p className="text-muted-foreground">{t.pleaseWait}</p>
        </div>
      </div>
    );
  }

  if (analysis === null) {
    return (
      <div className="flex items-center justify-center h-screen text-center">
        <div>
          <h1 className="text-2xl font-semibold text-red-500 mb-4">
            {t.analysisNotFound}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t.analysisNotFoundMessage}
          </p>
          <Button asChild>
            <Link href="/news">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToNews}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Prepare originTracingData from factCheck for diagram display
  const originTracingData = analysis.factCheck ? {
    originTracing: (analysis.factCheck as any).originTracing,
    beliefDrivers: (analysis.factCheck as any).beliefDrivers,
    sources: (analysis.factCheck as any).sources,
    verdict: (analysis.factCheck as any).verdict,
    content: (analysis.factCheck as any).content,
    claim: (analysis.factCheck as any).claim,
    allLinks: (analysis.factCheck as any).allLinks,
  } : undefined;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/news">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToAllAnalyses}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-primary" />
            {t.analysisComplete}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-left">
        {/* Video Metadata */}
        <div className="border-2 rounded-lg px-6 py-4 !border-b-2">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Video Information
            </h4>
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors">
                <div className="space-y-2">
                  <h5 className="font-medium text-base">
                    {analysis.metadata?.title || t.analysis}
                  </h5>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {analysis.metadata?.creator || t.unknownCreator}
                    </span>
                    {analysis.metadata?.platform && (
                      <Badge variant="secondary" className="text-xs">
                        {analysis.metadata.platform === "twitter"
                          ? "Twitter/X"
                          : "TikTok"}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatDate(
                        (analysis as any).createdAt || (analysis as any)._creationTime
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {analysis.metadata?.description &&
              analysis.metadata.description !== analysis.metadata.title && (
                <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors mb-4">
                  <div className="text-sm text-muted-foreground">
                    <strong>{t.description}:</strong>{" "}
                    {analysis.metadata.description}
                  </div>
                </div>
              )}

            {/* Creator Credibility Rating */}
            {analysis.metadata?.creator && analysis.metadata?.platform && (
              <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors mb-4">
                <CreatorCredibilityDisplay
                  creatorId={analysis.metadata.creator}
                  platform={analysis.metadata.platform}
                  showDetails={false}
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <a
                href={analysis.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {t.viewOriginalVideo} <ExternalLink className="h-3 w-3" />
              </a>

              {/* Download JSON of this analysis */}
              {(analysis as any).id && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/api/analyses/${encodeURIComponent(
                      (analysis as any).id
                    )}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download JSON
                  </a>
                </Button>
              )}

              {analysis.metadata?.creator && analysis.metadata?.platform && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/creator/${encodeURIComponent(
                      analysis.metadata.creator
                    )}?platform=${analysis.metadata.platform}`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t.viewAuthor}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Transcription */}
        {analysis.transcription &&
          analysis.transcription.text &&
          analysis.transcription.text.length > 0 && (
            <div className="border-2 rounded-lg px-6 py-4 !border-b-2 space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-lg">
                <ShieldCheckIcon className="h-5 w-5" />
                {t.transcription}
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors">
                <div className="text-sm leading-relaxed">
                  <AnalysisRenderer content={analysis.transcription.text} />
                </div>
                {analysis.transcription.language && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {t.language}: {analysis.transcription.language}
                  </p>
                )}
              </div>
            </div>
          )}

        {/* News Detection */}
        {analysis.newsDetection && (
          <div className="border-2 rounded-lg px-6 py-4 !border-b-2 space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-lg">
              <AlertCircleIcon className="h-5 w-5" />
              {t.contentAnalysis}
            </h4>
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t.contentType}:</span>
                  <Badge
                    variant={
                      analysis.newsDetection.contentType === "news_factual"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {analysis.newsDetection.contentType.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t.requiresFactCheck}:</span>
                  <Badge
                    variant={
                      analysis.requiresFactCheck ? "destructive" : "secondary"
                    }
                  >
                    {analysis.requiresFactCheck ? t.yes : t.no}
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t.confidence}:</span>
                  <span className="text-sm font-medium">
                    {Math.round(analysis.newsDetection.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sentiment Analysis */}
        {(analysis.factCheck as any)?.sentimentAnalysis && (
          <div className="border-2 rounded-lg px-6 py-4 !border-b-2 space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-lg">
              <TrendingUpIcon className="h-5 w-5" />
              Sentiment Analysis
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/20 transition-colors">
              <SentimentDisplay
                sentiment={(analysis.factCheck as any).sentimentAnalysis}
              />
            </div>
          </div>
        )}

        {/* Fact-Check Results - Use same component as Hero */}
        {analysis.factCheck && (
          <FactCheckDisplay
            factCheck={analysis.factCheck}
            originTracingData={originTracingData}
            currentData={analysis}
            previewMode={false}
          />
        )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

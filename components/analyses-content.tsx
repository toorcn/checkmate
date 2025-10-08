"use client";

import { useState } from "react";
import { useTikTokAnalysisById } from "@/lib/hooks/use-saved-analyses";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalysisRenderer } from "@/components/analysis-renderer";
import { OriginTracingDiagram } from "@/components/analysis/origin-tracing-diagram";
import { CreatorCredibilityDisplay } from "@/components/creator-credibility-display";
import { SentimentDisplay } from "@/components/analysis/sentiment-display";
import { useLanguage } from "@/components/global-translation-provider";
import { PoliticalBiasMeter } from "@/components/ui/political-bias-meter";

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/news">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToAllAnalyses}
        </Link>
      </Button>

      <div className="space-y-6 text-left">
        {/* Video Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {analysis.metadata?.title || t.analysis}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 pt-1">
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
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.metadata?.description &&
              analysis.metadata.description !== analysis.metadata.title && (
                <div className="mb-4 text-sm text-muted-foreground">
                  <strong>{t.description}:</strong>{" "}
                  {analysis.metadata.description}
                </div>
              )}

            {/* Creator Credibility Rating */}
            {analysis.metadata?.creator && analysis.metadata?.platform && (
              <div className="mb-4">
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
          </CardContent>
        </Card>

        {/* Transcription */}
        {analysis.transcription &&
          analysis.transcription.text &&
          analysis.transcription.text.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-lg">
                <ShieldCheckIcon className="h-5 w-5" />
                {t.transcription}
              </h4>
              <div className="p-4 bg-muted rounded-lg">
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
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-lg">
              <AlertCircleIcon className="h-5 w-5" />
              {t.contentAnalysis}
            </h4>
            <div className="p-4 bg-muted rounded-lg space-y-2">
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
              <div className="flex items-center justify-between">
                <span className="text-sm">{t.confidence}:</span>
                <span className="text-sm font-medium">
                  {Math.round(analysis.newsDetection.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sentiment Analysis */}
        {(analysis.factCheck as any)?.sentimentAnalysis && (
          <div className="mt-6">
            <SentimentDisplay
              sentiment={(analysis.factCheck as any).sentimentAnalysis}
            />
          </div>
        )}

        {/* Fact-Check Results */}
        {analysis.factCheck && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5" />
              {t.factCheckResults}
            </h4>

            {/* New format with verdict, explanation, etc. */}
            {analysis.factCheck.verdict && (
              <Card
                className={`border-l-4 ${
                  analysis.factCheck.verdict === "true" ||
                  analysis.factCheck.verdict === "verified"
                    ? "border-l-green-500"
                    : analysis.factCheck.verdict === "false"
                    ? "border-l-red-500"
                    : analysis.factCheck.verdict === "misleading"
                    ? "border-l-yellow-500"
                    : analysis.factCheck.verdict === "satire"
                    ? "border-l-purple-500"
                    : "border-l-gray-500"
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-base mb-2">
                          {t.overallVerificationStatus}
                        </h5>
                        {analysis.factCheck.content && (
                          <div className="text-sm text-muted-foreground mb-2">
                            <AnalysisRenderer
                              content={analysis.factCheck.content}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusIcon(analysis.factCheck.verdict)}
                        {getStatusBadge(analysis.factCheck.verdict)}
                      </div>
                    </div>

                    {/* Origin Tracing Diagram (matches HeroSection) */}
                    {(analysis.factCheck as any)?.originTracing
                      ?.hypothesizedOrigin && (
                      <div className="mt-4">
                        <p className="font-medium mb-3 text-base">
                          Origin Tracing & Belief Evolution:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <OriginTracingDiagram
                            originTracing={
                              (analysis.factCheck as any).originTracing
                            }
                            beliefDrivers={
                              (analysis.factCheck as any).beliefDrivers
                            }
                            sources={(analysis.factCheck as any).sources?.map(
                              (s: any) => ({
                                url: s.url,
                                title: s.title || s.source,
                                source: s.source || s.title,
                                credibility:
                                  s.credibility ?? s.relevance ?? 0.5,
                              })
                            )}
                            verdict={(analysis.factCheck as any).verdict}
                            content={(analysis.factCheck as any).content}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expandable Detailed Analysis Section */}
                    {analysis.factCheck.explanation && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="font-medium mb-3 text-base">
                          {t.analysis}:
                        </p>
                        <div>
                          {(() => {
                            const explanation = (analysis.factCheck as any)
                              .explanation as string;
                            const shouldTruncate = explanation.length > 500;
                            const contentToShow =
                              shouldTruncate && !isAnalysisExpanded
                                ? explanation.substring(0, 500) + "..."
                                : explanation;
                            return <AnalysisRenderer content={contentToShow} />;
                          })()}
                        </div>
                        {(() => {
                          const explanation = (analysis.factCheck as any)
                            .explanation as string;
                          if (!explanation || explanation.length <= 500)
                            return null;
                          return (
                            <button
                              onClick={() =>
                                setIsAnalysisExpanded(!isAnalysisExpanded)
                              }
                              className="mt-4 text-primary hover:text-primary/80 font-medium transition-colors text-sm flex items-center gap-1"
                            >
                              {isAnalysisExpanded ? (
                                <>
                                  <ChevronUpIcon className="h-4 w-4" />
                                  {t.showLess}
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="h-4 w-4" />
                                  {t.showMore}
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    )}

                    {analysis.factCheck.sources &&
                      analysis.factCheck.sources.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">
                            {t.sources} ({analysis.factCheck.sources.length}{" "}
                            {t.sourcesFound}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.factCheck.sources
                              .slice(0, 5)
                              .map((source: any, sourceIndex: number) => (
                                <Button
                                  key={sourceIndex}
                                  size="sm"
                                  variant="outline"
                                  asChild
                                >
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs"
                                  >
                                    {source.source ||
                                      new URL(source.url).hostname}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Origin Tracing Text (Fallback) */}
                    {analysis.factCheck.originTracing?.hypothesizedOrigin && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="font-medium mb-2 text-base">Origin:</p>
                        <div className="text-sm text-muted-foreground">
                          <AnalysisRenderer
                            content={
                              analysis.factCheck.originTracing
                                .hypothesizedOrigin
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Why People Believe This */}
                    {analysis.factCheck.beliefDrivers &&
                      analysis.factCheck.beliefDrivers.length > 0 && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="font-medium mb-2 text-base">
                            Why People Believe This:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {analysis.factCheck.beliefDrivers
                              .slice(0, 5)
                              .map(
                                (
                                  d: { name: string; description: string },
                                  i: number
                                ) => (
                                  <li key={i}>
                                    <span className="font-medium">
                                      {d.name}:
                                    </span>{" "}
                                    {d.description}
                                  </li>
                                )
                              )}
                          </ul>
                        </div>
                      )}

                    {/* Political Bias Meter - Only for Malaysia Political Content */}
                    {analysis.factCheck.politicalBias?.isMalaysiaPolitical &&
                      analysis.factCheck.politicalBias?.malaysiaBiasScore !== undefined && (
                        <PoliticalBiasMeter
                          biasScore={analysis.factCheck.politicalBias.malaysiaBiasScore}
                          explanation={analysis.factCheck.politicalBias.explanation}
                          keyQuote={analysis.factCheck.politicalBias.keyQuote}
                          confidence={analysis.factCheck.politicalBias.confidence}
                          biasIndicators={analysis.factCheck.politicalBias.biasIndicators}
                          politicalTopics={analysis.factCheck.politicalBias.politicalTopics}
                        />
                      )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {analysis.factCheck.confidence && (
                        <span>
                          {t.confidence}: {analysis.factCheck.confidence}%
                        </span>
                      )}
                      {analysis.factCheck.isVerified !== undefined && (
                        <span>
                          {t.verified}:{" "}
                          {analysis.factCheck.isVerified ? t.yes : t.no}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legacy format with results array */}
            {analysis.factCheck.results &&
              analysis.factCheck.results.length > 0 &&
              analysis.factCheck.results.map((result: any, index: number) => {
                const isExpanded = expandedClaims[index] || false;
                const analysisText = result.analysis || "";
                const shouldTruncate = analysisText.length > 300;

                return (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      result.status === "true"
                        ? "border-l-green-500"
                        : result.status === "false"
                        ? "border-l-red-500"
                        : result.status === "misleading"
                        ? "border-l-yellow-500"
                        : "border-l-gray-500"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-base mb-2">
                              {t.claim}
                            </h5>
                            <div className="text-sm text-muted-foreground mb-2">
                              <AnalysisRenderer content={result.claim} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusIcon(result.status)}
                            {getStatusBadge(result.status)}
                          </div>
                        </div>

                        {analysisText && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="font-medium mb-3 text-base">
                              {t.analysis}:
                            </p>
                            <div>
                              <AnalysisRenderer
                                content={
                                  shouldTruncate && !isExpanded
                                    ? analysisText.substring(0, 300) + "..."
                                    : analysisText
                                }
                              />
                            </div>
                            {shouldTruncate && (
                              <button
                                onClick={() =>
                                  setExpandedClaims((prev) => ({
                                    ...prev,
                                    [index]: !isExpanded,
                                  }))
                                }
                                className="mt-4 text-primary hover:text-primary/80 font-medium transition-colors text-sm flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUpIcon className="h-4 w-4" />
                                    {t.showLess}
                                  </>
                                ) : (
                                  <>
                                    <ChevronDownIcon className="h-4 w-4" />
                                    {t.showMore}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {result.sources && result.sources.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2">
                              {t.sources} ({result.sources.length}{" "}
                              {t.sourcesFound}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {result.sources
                                .slice(0, 5)
                                .map(
                                  (sourceUrl: string, sourceIndex: number) => (
                                    <Button
                                      key={sourceIndex}
                                      size="sm"
                                      variant="outline"
                                      asChild
                                    >
                                      <a
                                        href={sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs"
                                      >
                                        {new URL(sourceUrl).hostname}
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                      </a>
                                    </Button>
                                  )
                                )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {t.confidence}:{" "}
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

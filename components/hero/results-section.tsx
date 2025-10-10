"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { AnalysisRenderer } from "@/components/analysis-renderer";
import { useLanguage } from "@/components/global-translation-provider";
import { useDiagramExpansion } from "@/lib/hooks/useDiagramExpansion";
import { MetadataDisplay } from "./metadata-display";
import { FactCheckDisplay } from "./fact-check-display";
import { ActionButtons } from "./action-buttons";
import { AnalysisData, AnalysisResult, MockResult, TikTokAnalysisResult } from "@/types/analysis";

interface ResultsSectionProps {
  result: TikTokAnalysisResult | null;
  mockResult: MockResult | null;
  isSignedIn: boolean;
  isSaving: boolean;
  isSaved: boolean;
  savedId: string | null;
  onSaveAnalysis: () => void;
  onCopySummary: () => void;
  onShare: () => void;
  onReset: () => void;
}

export function ResultsSection({
  result,
  mockResult,
  isSignedIn,
  isSaving,
  isSaved,
  savedId,
  onSaveAnalysis,
  onCopySummary,
  onShare,
  onReset,
}: ResultsSectionProps) {
  const { isExpanded: isDiagramExpanded } = useDiagramExpansion();
  const { t } = useLanguage();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to results when available
  useEffect(() => {
    if ((result?.success && result.data) || (mockResult?.success && mockResult.data)) {
      queueMicrotask(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [result, mockResult]);

  if (!result && !mockResult) return null;

  const currentData = result?.success && result.data ? result.data : mockResult?.data;
  if (!currentData) return null;

  const originTracingData = (currentData as any)?.originTracingData;

  return (
    <div ref={resultsRef} className="mx-auto max-w-7xl mt-8 px-2 sm:px-4">
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
          <div className="space-y-6 text-left">
            {/* Video Metadata */}
            <MetadataDisplay metadata={currentData.metadata} />

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
                      <AnalysisRenderer content={currentData.transcription.text} />
                    </div>
                    {currentData.transcription.language && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Language: {currentData.transcription.language}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* Platform Analysis */}
            {/* <div className="space-y-3">
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
                  <span className="text-sm">Fact-Check Required:</span>
                  <Badge
                    variant={
                      currentData.requiresFactCheck ? "destructive" : "secondary"
                    }
                  >
                    {currentData.requiresFactCheck ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div> */}

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
                        currentData.newsDetection.contentType === "news_factual"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {currentData.newsDetection.contentType === "news_factual"
                        ? "News/Factual"
                        : "Entertainment"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requires Fact-Check:</span>
                    <Badge
                      variant={
                        currentData.requiresFactCheck ? "destructive" : "secondary"
                      }
                    >
                      {currentData.requiresFactCheck ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence:</span>
                    <span className="text-sm font-medium">
                      {Math.round(currentData.newsDetection.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fact-Check Results */}
            {currentData.factCheck && (
              <FactCheckDisplay
                factCheck={currentData.factCheck}
                originTracingData={originTracingData}
                currentData={currentData}
              />
            )}

            {/* Action Buttons */}
            <ActionButtons
              isSignedIn={isSignedIn}
              isSaving={isSaving}
              isSaved={isSaved}
              savedId={savedId}
              dataSource={currentData}
              onSaveAnalysis={onSaveAnalysis}
              onCopySummary={onCopySummary}
              onShare={onShare}
              onReset={onReset}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

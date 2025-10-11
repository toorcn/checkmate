"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import { AnalysisRenderer } from "@/components/analysis-renderer";

interface AnalysisDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AnalysisDetailModal({
  isOpen,
  onClose,
  title,
  children,
}: AnalysisDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-5xl w-[92vw] sm:!max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

interface VerdictDetailContentProps {
  verdict: string;
  confidence: number;
  verdictDefinition?: string;
  description: string;
  explanation?: string;
  statusIcon: React.ReactNode;
  statusBadge: React.ReactNode;
}

export function VerdictDetailContent({
  verdict: _verdict,
  confidence,
  verdictDefinition,
  description,
  explanation,
  statusIcon,
  statusBadge,
}: VerdictDetailContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
            {statusIcon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Verification Status</h3>
            <p className="text-sm text-muted-foreground">
              {confidence}% confidence
            </p>
          </div>
        </div>
        {statusBadge}
      </div>

      {/* Verdict Definition */}
      {verdictDefinition && (
        <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span className="text-primary">What does this verdict mean?</span>
          </h4>
          <p className="text-sm text-foreground leading-relaxed">
            {verdictDefinition}
          </p>
        </div>
      )}

      {/* Description */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-2">Summary</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Detailed Explanation */}
      {explanation && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">Detailed Analysis</h4>
          <div className="prose dark:prose-invert max-w-none">
            <AnalysisRenderer content={explanation} />
          </div>
        </div>
      )}
    </div>
  );
}

interface SourcesDetailContentProps {
  sources: any[];
}

export function SourcesDetailContent({ sources }: SourcesDetailContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sources.length} sources used for verification
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((source: any, index: number) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 break-words">
                  {source.title || "Untitled Source"}
                </h4>
                <p className="text-xs text-muted-foreground break-all">
                  {source.url}
                </p>
                {source.credibility !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 max-w-[200px]">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(source.credibility * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(source.credibility * 100)}% credible
                    </span>
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline" asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BeliefDriversDetailContentProps {
  beliefDrivers: any[];
}

export function BeliefDriversDetailContent({
  beliefDrivers,
}: BeliefDriversDetailContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Understanding the psychological and social factors that contribute to
        belief in this content
      </p>

      <div className="space-y-3">
        {beliefDrivers.map((driver: any, index: number) => (
          <div
            key={index}
            className="bg-muted/30 rounded-lg p-4 border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">{driver.name}</h4>
                <p className="text-sm text-foreground">
                  {driver.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

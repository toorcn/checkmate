"use client";

import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  LoaderIcon,
  CopyIcon,
  Share2Icon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/global-translation-provider";
import { AnalysisData, TikTokAnalysisData } from "@/types/analysis";

interface ActionButtonsProps {
  isSignedIn: boolean;
  isSaving: boolean;
  isSaved: boolean;
  savedId: string | null;
  dataSource: AnalysisData | TikTokAnalysisData | null;
  onSaveAnalysis: () => void;
  onCopySummary: () => void;
  onShare: () => void;
  onReset: () => void;
}

export function ActionButtons({
  isSignedIn,
  isSaving,
  isSaved,
  savedId,
  dataSource,
  onSaveAnalysis,
  onCopySummary,
  onShare,
  onReset,
}: ActionButtonsProps) {
  const { t } = useLanguage();

  return (
    <div className="pt-4 border-t">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Primary actions row */}
        <div className="flex gap-2 flex-wrap">
          {/* Save Button - Only show for authenticated users */}
          {isSignedIn && (
            <Button
              onClick={onSaveAnalysis}
              disabled={isSaving || isSaved}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              {isSaving ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSaved
                  ? t.saved
                  : isSaving
                    ? t.saving
                    : t.saveAnalysis}
              </span>
              <span className="sm:hidden">
                {isSaved ? "Saved" : isSaving ? "Saving..." : "Save"}
              </span>
            </Button>
          )}

          <Button variant="outline" onClick={onCopySummary} aria-label="Copy summary" className="flex-1 sm:flex-none">
            <CopyIcon className="h-4 w-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Copy summary</span>
            <span className="sm:hidden">Copy</span>
          </Button>
          <Button variant="outline" onClick={onShare} aria-label="Share analysis" className="flex-1 sm:flex-none">
            <Share2Icon className="h-4 w-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Share</span>
            <span className="sm:hidden">Share</span>
          </Button>
        </div>

        {/* Secondary actions row */}
        <div className="flex gap-2 flex-wrap">
          {/* Download after save */}
          {isSignedIn && isSaved && savedId && (
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <a
                href={`/api/analyses/${encodeURIComponent(savedId)}/download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hidden sm:inline">Download JSON</span>
                <span className="sm:hidden">Download</span>
              </a>
            </Button>
          )}

          <Button variant="outline" onClick={onReset} className="flex-1 sm:flex-none">
            {t.reset}
          </Button>
        </div>
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
  );
}

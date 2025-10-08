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
import { useLanguage } from "@/components/language-provider";
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
      <div className="flex gap-3 flex-wrap">
        {/* Save Button - Only show for authenticated users */}
        {isSignedIn && (
          <Button
            onClick={onSaveAnalysis}
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

        <Button variant="outline" onClick={onCopySummary} aria-label="Copy summary">
          <CopyIcon className="h-4 w-4 mr-2" /> Copy summary
        </Button>
        <Button variant="outline" onClick={onShare} aria-label="Share analysis">
          <Share2Icon className="h-4 w-4 mr-2" /> Share
        </Button>

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

        <Button variant="outline" onClick={onReset}>
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
  );
}

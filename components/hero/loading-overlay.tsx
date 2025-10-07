"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoaderIcon } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  isMockLoading: boolean;
  progress: number;
  phase: string;
}

export function LoadingOverlay({
  isLoading,
  isMockLoading,
  progress,
  phase,
}: LoadingOverlayProps) {
  if (!isLoading && !isMockLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md" aria-busy="true" aria-live="polite">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm animate-in fade-in-0 zoom-in-95">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-primary text-xl">
            <LoaderIcon className="h-6 w-6 animate-spin" />
            Analyzing Content...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
            {phase && (
              <p className="text-xs text-center text-gray-600 dark:text-gray-300">{phase}</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground text-center space-y-3">
            <p className="font-medium">
              We are transcribing the video, detecting news content, and
              fact-checking claims using AI.
            </p>
            <p>
              This may take up to a minute for longer videos. Please don't
              close this tab.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span className="ml-2">Verifying sources and analyzing credibility</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

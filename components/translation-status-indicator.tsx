"use client";

import * as React from "react";
import { Globe, Check, X } from "lucide-react";
import { useGlobalTranslation } from "@/components/global-translation-provider";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

/**
 * Translation status indicator that shows when page translation is active
 */
export function TranslationStatusIndicator() {
  const { 
    isTranslating, 
    hasTranslatedContent, 
    language, 
    translationProgress,
    availableLanguages,
    cancelTranslation 
  } = useGlobalTranslation();

  const [showSuccess, setShowSuccess] = React.useState(false);
  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  // Auto-hide success message after 3 seconds
  React.useEffect(() => {
    if (hasTranslatedContent && !isTranslating) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    } else {
      setShowSuccess(false);
    }
  }, [hasTranslatedContent, isTranslating]);

  // Don't show indicator for English
  if (language === "en") return null;

  // Don't show if no translation activity
  if (!isTranslating && !showSuccess) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-sm">
        {isTranslating ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-spin">
                  <Globe className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Translating page...</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelTranslation}
                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <div className="space-y-1">
              <Progress value={translationProgress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                Converting to {currentLanguage?.nativeName} using AWS Translate
              </p>
            </div>
          </div>
        ) : showSuccess ? (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              Page translated to <span className="font-medium">{currentLanguage?.nativeName}</span>
            </span>
            <span className="text-lg">{currentLanguage?.flag}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

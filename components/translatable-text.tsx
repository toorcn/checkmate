"use client";

import * as React from "react";
import { useTranslation } from "@/components/translation-provider";
import { Button } from "@/components/ui/button";
import { Globe, Languages } from "lucide-react";

interface TranslatableTextProps {
  children: string | React.ReactNode;
  originalLanguage?: string;
  fallback?: string;
  className?: string;
  enableInlineTranslation?: boolean;
}

/**
 * Component that can translate its text content using AWS Translate
 */
export function TranslatableText({
  children,
  originalLanguage = "auto",
  fallback,
  className,
  enableInlineTranslation = true,
}: TranslatableTextProps) {
  const { language, translateContent, enableRealTimeTranslation, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = React.useState<string>("");
  const [isLocalTranslating, setIsLocalTranslating] = React.useState(false);
  const [showOriginal, setShowOriginal] = React.useState(false);

  const originalText = typeof children === "string" ? children : fallback || "";

  // Auto-translate when real-time translation is enabled and language changes
  React.useEffect(() => {
    if (enableRealTimeTranslation && originalText && language !== "en") {
      handleTranslation();
    } else {
      setTranslatedText("");
    }
  }, [language, enableRealTimeTranslation, originalText]);

  const handleTranslation = async () => {
    if (!originalText) return;
    
    setIsLocalTranslating(true);
    try {
      const translated = await translateContent(originalText, language);
      setTranslatedText(translated);
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedText(originalText);
    } finally {
      setIsLocalTranslating(false);
    }
  };

  const displayText = React.useMemo(() => {
    if (showOriginal) return originalText;
    if (enableRealTimeTranslation && translatedText) return translatedText;
    return originalText;
  }, [showOriginal, enableRealTimeTranslation, translatedText, originalText]);

  if (typeof children !== "string") {
    return <>{children}</>;
  }

  return (
    <div className={`relative group ${className || ""}`}>
      <span>
        {isLocalTranslating ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <div className="animate-spin">
              <Globe className="h-3 w-3" />
            </div>
            Translating...
          </span>
        ) : (
          displayText
        )}
      </span>

      {/* Inline translation controls */}
      {enableInlineTranslation && originalText && !isLocalTranslating && (
        <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="flex items-center gap-1 bg-background border rounded-md shadow-md p-1">
            {!enableRealTimeTranslation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTranslation}
                className="h-6 px-2 text-xs"
              >
                <Languages className="h-3 w-3 mr-1" />
                Translate
              </Button>
            )}
            
            {translatedText && translatedText !== originalText && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowOriginal(!showOriginal)}
                className="h-6 px-2 text-xs"
              >
                {showOriginal ? "Translated" : "Original"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TranslatableContentProps {
  content: any;
  contentKey?: string;
  className?: string;
}

/**
 * Component for translating analysis content dynamically
 */
export function TranslatableContent({
  content,
  contentKey = "text",
  className,
}: TranslatableContentProps) {
  const { translateAnalysis, enableRealTimeTranslation, language } = useTranslation();
  const [translatedContent, setTranslatedContent] = React.useState<any>(null);
  const [isTranslating, setIsTranslating] = React.useState(false);

  React.useEffect(() => {
    if (enableRealTimeTranslation && content && language !== "en") {
      handleContentTranslation();
    } else {
      setTranslatedContent(null);
    }
  }, [content, language, enableRealTimeTranslation]);

  const handleContentTranslation = async () => {
    if (!content) return;

    setIsTranslating(true);
    try {
      const translated = await translateAnalysis(content);
      setTranslatedContent(translated);
    } catch (error) {
      console.error("Content translation failed:", error);
      setTranslatedContent(content);
    } finally {
      setIsTranslating(false);
    }
  };

  const displayContent = translatedContent || content;

  if (isTranslating) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className || ""}`}>
        <div className="animate-spin">
          <Globe className="h-4 w-4" />
        </div>
        Translating content...
      </div>
    );
  }

  if (typeof displayContent === "string") {
    return (
      <TranslatableText className={className}>
        {displayContent}
      </TranslatableText>
    );
  }

  // For complex objects, render as before but with translatable strings
  return <div className={className}>{displayContent}</div>;
}

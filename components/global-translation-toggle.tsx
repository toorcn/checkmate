"use client";

import * as React from "react";
import { Languages, Globe, Settings, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useGlobalTranslation } from "@/components/global-translation-provider";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GlobalTranslationToggle() {
  const { 
    language, 
    setLanguage, 
    t, 
    availableLanguages,
    enableAutoTranslation,
    setEnableAutoTranslation,
    isTranslating,
    translateCurrentPage,
    restoreToOriginal,
    translationProgress,
    hasTranslatedContent
  } = useGlobalTranslation();

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {isTranslating ? (
            <div className="animate-spin">
              <RefreshCw className="h-[1.2rem] w-[1.2rem]" />
            </div>
          ) : (
            <Globe className="h-[1.2rem] w-[1.2rem]" />
          )}
          
          {/* Status indicators */}
          {enableAutoTranslation && !isTranslating && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
          )}
          {hasTranslatedContent && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          )}
          
          <span className="sr-only">Global Translation Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">Global Page Translation</h4>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Translation Progress */}
          {isTranslating && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Translating Page...
                </span>
              </div>
              <Progress value={translationProgress} className="h-2" />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Using AWS Translate to convert all text content
              </p>
            </div>
          )}

          {/* Auto Translation Toggle */}
          <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg bg-muted/50">
            <Switch
              id="auto-translation"
              checked={enableAutoTranslation}
              onCheckedChange={setEnableAutoTranslation}
              disabled={isTranslating}
            />
            <div className="flex-1">
              <Label htmlFor="auto-translation" className="text-sm font-medium">
                Auto-translate entire page
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically translate all page content when language changes
              </p>
            </div>
          </div>

          {/* Current Status */}
          {hasTranslatedContent && (
            <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-700 dark:text-green-300">
              ✓ Page translated to {currentLanguage?.nativeName}
            </div>
          )}

          {/* Manual Translation Controls */}
          {!enableAutoTranslation && (
            <div className="flex gap-2 mb-4">
              <Button
                onClick={translateCurrentPage}
                disabled={isTranslating || language === "en"}
                size="sm"
                className="flex-1"
              >
                <Languages className="h-3 w-3 mr-1" />
                Translate Now
              </Button>
              
              {hasTranslatedContent && (
                <Button
                  onClick={restoreToOriginal}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Show Original
                </Button>
              )}
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Language Selection */}
        <div className="p-1 max-h-60 overflow-y-auto">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground mb-1">
            Select Language
          </div>
          {availableLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code as any)}
              className={`cursor-pointer ${language === lang.code ? "bg-accent" : ""}`}
              disabled={isTranslating}
            >
              <span className="mr-3 text-lg">{lang.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{lang.name}</div>
                <div className="text-xs text-muted-foreground">
                  {lang.nativeName}
                </div>
              </div>
              {language === lang.code && (
                <div className="ml-2 w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>Powered by AWS Translate</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            • Translates entire page content dynamically
            <br />
            • Preserves original formatting and structure
            <br />
            • Smart caching for better performance
          </div>

          {enableAutoTranslation && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              ⚡ Auto-translation active - page content will be translated when language changes
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile version with simplified interface
export function MobileGlobalTranslationToggle() {
  const { 
    language, 
    setLanguage, 
    availableLanguages,
    enableAutoTranslation,
    setEnableAutoTranslation,
    isTranslating,
    translateCurrentPage,
    restoreToOriginal,
    hasTranslatedContent
  } = useGlobalTranslation();

  return (
    <div className="w-full space-y-4">
      {/* Language Selection Grid */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Language</Label>
        <div className="grid grid-cols-3 gap-2">
          {availableLanguages.map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage(lang.code as any)}
              disabled={isTranslating}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-xs">{lang.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Auto Translation Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex-1">
          <Label htmlFor="mobile-auto-translation" className="text-sm font-medium">
            Auto-translate Page
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Automatically translate all content using AWS
          </p>
        </div>
        <Switch
          id="mobile-auto-translation"
          checked={enableAutoTranslation}
          onCheckedChange={setEnableAutoTranslation}
          disabled={isTranslating}
        />
      </div>

      {/* Manual Controls */}
      {!enableAutoTranslation && (
        <div className="flex gap-2">
          <Button
            onClick={translateCurrentPage}
            disabled={isTranslating || language === "en"}
            size="sm"
            className="flex-1"
          >
            {isTranslating ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Languages className="h-3 w-3 mr-1" />
            )}
            Translate Page
          </Button>
          
          {hasTranslatedContent && (
            <Button
              onClick={restoreToOriginal}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Original
            </Button>
          )}
        </div>
      )}

      {/* Status */}
      {isTranslating && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <div className="animate-spin">
            <Globe className="h-3 w-3" />
          </div>
          Translating entire page...
        </div>
      )}

      {hasTranslatedContent && !isTranslating && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          ✓ Page translated successfully
        </div>
      )}
    </div>
  );
}

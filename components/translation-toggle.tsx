"use client";

import * as React from "react";
import { Languages, Globe, Settings } from "lucide-react";
import { useTranslation } from "@/components/translation-provider";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TranslationToggle() {
  const { 
    language, 
    setLanguage, 
    t, 
    availableLanguages,
    enableRealTimeTranslation,
    setEnableRealTimeTranslation,
    isTranslating
  } = useTranslation();

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {isTranslating ? (
            <div className="animate-spin">
              <Globe className="h-[1.2rem] w-[1.2rem]" />
            </div>
          ) : (
            <Languages className="h-[1.2rem] w-[1.2rem]" />
          )}
          {enableRealTimeTranslation && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          )}
          <span className="sr-only">{t.toggleLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="p-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Language & Translation</h4>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Real-time Translation Toggle */}
          <div className="flex items-center space-x-2 mb-3 p-2 rounded-lg bg-muted/50">
            <Switch
              id="real-time-translation"
              checked={enableRealTimeTranslation}
              onCheckedChange={setEnableRealTimeTranslation}
            />
            <Label htmlFor="real-time-translation" className="text-xs">
              Real-time Translation (AWS)
            </Label>
          </div>

          {enableRealTimeTranslation && (
            <div className="text-xs text-muted-foreground mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              Content will be automatically translated using AWS Translate when language is changed.
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Language Selection */}
        <div className="p-1">
          {availableLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`cursor-pointer ${language === lang.code ? "bg-accent" : ""}`}
            >
              <span className="mr-2">{lang.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{lang.label}</div>
                <div className="text-xs text-muted-foreground">
                  AWS Code: {lang.awsCode}
                </div>
              </div>
              {language === lang.code && (
                <div className="ml-2 w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <div className="p-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Powered by AWS Translate
          </div>
          {isTranslating && (
            <div className="mt-1 text-blue-600 dark:text-blue-400">
              Translating content...
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile version with simplified interface
export function MobileTranslationToggle() {
  const { 
    language, 
    setLanguage, 
    t, 
    availableLanguages,
    enableRealTimeTranslation,
    setEnableRealTimeTranslation,
    isTranslating
  } = useTranslation();

  return (
    <div className="w-full space-y-3">
      {/* Language Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Language</Label>
        <div className="grid grid-cols-3 gap-2">
          {availableLanguages.map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage(lang.code)}
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-xs">{lang.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Real-time Translation Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex-1">
          <Label htmlFor="mobile-rt-translation" className="text-sm font-medium">
            AWS Real-time Translation
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-translate content to your preferred language
          </p>
        </div>
        <Switch
          id="mobile-rt-translation"
          checked={enableRealTimeTranslation}
          onCheckedChange={setEnableRealTimeTranslation}
        />
      </div>

      {isTranslating && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <div className="animate-spin">
            <Globe className="h-3 w-3" />
          </div>
          Translating content...
        </div>
      )}
    </div>
  );
}

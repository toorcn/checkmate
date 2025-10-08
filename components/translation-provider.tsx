"use client";

import * as React from "react";
import { Language, translations, Translations } from "@/lib/translations";
import { 
  translateText, 
  translateAnalysisResult, 
  translateUIElements,
  TranslatableAnalysisResult,
  SupportedLanguage,
  SUPPORTED_LANGUAGES 
} from "@/lib/translate";

interface TranslationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
  translateContent: (text: string, targetLanguage?: string) => Promise<string>;
  translateAnalysis: (analysis: TranslatableAnalysisResult, targetLanguage?: string) => Promise<TranslatableAnalysisResult>;
  isTranslating: boolean;
  enableRealTimeTranslation: boolean;
  setEnableRealTimeTranslation: (enabled: boolean) => void;
  availableLanguages: Array<{ code: Language; label: string; flag: string; awsCode: string }>;
}

const TranslationContext = React.createContext<TranslationContextType | undefined>(
  undefined
);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>("en");
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [enableRealTimeTranslation, setEnableRealTimeTranslation] = React.useState(false);

  // Extended language support with AWS Translate
  const availableLanguages = React.useMemo(() => [
    { code: "en" as Language, label: "English", flag: "🇺🇸", awsCode: "en" },
    { code: "ms" as Language, label: "Bahasa Malaysia", flag: "🇲🇾", awsCode: "ms" },
    { code: "zh" as Language, label: "中文", flag: "🇨🇳", awsCode: "zh" },
  ], []);

  // Load language from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("language") as Language;
    if (stored && (stored === "en" || stored === "ms" || stored === "zh")) {
      setLanguage(stored);
    }
    
    // Load real-time translation preference
    const rtTranslation = localStorage.getItem("enableRealTimeTranslation");
    if (rtTranslation === "true") {
      setEnableRealTimeTranslation(true);
    }
  }, []);

  // Save language to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Save real-time translation preference
  React.useEffect(() => {
    localStorage.setItem("enableRealTimeTranslation", enableRealTimeTranslation.toString());
  }, [enableRealTimeTranslation]);

  // Translate content function
  const translateContent = React.useCallback(async (
    text: string, 
    targetLanguage?: string
  ): Promise<string> => {
    if (!enableRealTimeTranslation) {
      return text;
    }

    const target = targetLanguage || language;
    
    if (target === "en") {
      return text; // No translation needed for English
    }

    setIsTranslating(true);
    try {
      const result = await translateText(text, target);
      return result.translatedText;
    } catch (error) {
      console.error("Translation failed:", error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [language, enableRealTimeTranslation]);

  // Translate analysis function
  const translateAnalysis = React.useCallback(async (
    analysis: TranslatableAnalysisResult,
    targetLanguage?: string
  ): Promise<TranslatableAnalysisResult> => {
    if (!enableRealTimeTranslation) {
      return analysis;
    }

    const target = targetLanguage || language;
    
    if (target === "en") {
      return analysis; // No translation needed for English
    }

    setIsTranslating(true);
    try {
      const result = await translateAnalysisResult(analysis, target);
      return result;
    } catch (error) {
      console.error("Analysis translation failed:", error);
      return analysis;
    } finally {
      setIsTranslating(false);
    }
  }, [language, enableRealTimeTranslation]);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      translateContent,
      translateAnalysis,
      isTranslating,
      enableRealTimeTranslation,
      setEnableRealTimeTranslation,
      availableLanguages,
    }),
    [
      language, 
      translateContent, 
      translateAnalysis, 
      isTranslating, 
      enableRealTimeTranslation,
      availableLanguages
    ]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = React.useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}

// Backward compatibility hook
export function useLanguage() {
  const context = useTranslation();
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t: context.t,
  };
}

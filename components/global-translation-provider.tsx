"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Language, translations, Translations } from "@/lib/translations";
import { 
  translatePageContent, 
  restoreOriginalContent, 
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  clearTranslationCache 
} from "@/lib/global-translate";

interface GlobalTranslationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
  isTranslating: boolean;
  enableAutoTranslation: boolean;
  setEnableAutoTranslation: (enabled: boolean) => void;
  availableLanguages: Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
  }>;
  translateCurrentPage: () => Promise<void>;
  restoreToOriginal: () => void;
  translationProgress: number;
  hasTranslatedContent: boolean;
  cancelTranslation: () => void;
}

const GlobalTranslationContext = React.createContext<GlobalTranslationContextType | undefined>(
  undefined
);

export function GlobalTranslationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Track route changes
  const [language, setLanguage] = React.useState<Language>("en");
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [enableAutoTranslation, setEnableAutoTranslation] = React.useState(false);
  const [translationProgress, setTranslationProgress] = React.useState(0);
  const [hasTranslatedContent, setHasTranslatedContent] = React.useState(false);
  const [translationCancelled, setTranslationCancelled] = React.useState(false);

  // Available languages from our global translate system
  const availableLanguages = React.useMemo(() => 
    Object.values(SUPPORTED_LANGUAGES), // Only 3 languages now: en, ms, zh
  []);

  // Load preferences from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("language") as Language;
    if (stored && (stored === "en" || stored === "ms" || stored === "zh")) {
      setLanguage(stored);
    }
    
    const autoTranslate = localStorage.getItem("enableAutoTranslation");
    if (autoTranslate === "true") {
      setEnableAutoTranslation(true);
    }
  }, []);

  // Save preferences to localStorage
  React.useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  React.useEffect(() => {
    localStorage.setItem("enableAutoTranslation", enableAutoTranslation.toString());
  }, [enableAutoTranslation]);

  const restoreToOriginal = React.useCallback(() => {
    restoreOriginalContent();
    setHasTranslatedContent(false);
  }, []);

  const translateCurrentPage = React.useCallback(async () => {
    if (language === "en" || isTranslating) return;

    setIsTranslating(true);
    setTranslationProgress(0);
    setTranslationCancelled(false);

    try {
      // Restore any previously translated content first to ensure clean translation
      if (hasTranslatedContent) {
        restoreOriginalContent();
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setTranslationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const translations = await translatePageContent(language);
      
      clearInterval(progressInterval);
      
      // Check if translation was cancelled
      if (translationCancelled) {
        restoreOriginalContent();
        setHasTranslatedContent(false);
        return;
      }
      
      setTranslationProgress(100);
      setHasTranslatedContent(translations.size > 0);

      // Complete progress after a short delay
      setTimeout(() => setTranslationProgress(0), 1000);

    } catch (error) {
      console.error("Page translation failed:", error);
      setHasTranslatedContent(false);
    } finally {
      setIsTranslating(false);
    }
  }, [language, isTranslating, hasTranslatedContent, translationCancelled]);

  const cancelTranslation = React.useCallback(() => {
    setTranslationCancelled(true);
    setIsTranslating(false);
    setTranslationProgress(0);
    restoreOriginalContent();
    setHasTranslatedContent(false);
    // Reset to English
    setLanguage("en");
    setEnableAutoTranslation(false);
  }, []);

  // Auto-translate when language changes and auto-translation is enabled
  React.useEffect(() => {
    if (enableAutoTranslation && language !== "en") {
      // Small delay to allow UI to update
      const timeoutId = setTimeout(() => {
        translateCurrentPage();
      }, 100);
      return () => clearTimeout(timeoutId);
    } else if (language === "en" || !enableAutoTranslation) {
      // Restore original content if switching back to English or disabling auto-translation
      restoreToOriginal();
    }
  }, [language, enableAutoTranslation, translateCurrentPage, restoreToOriginal]);

  // Auto-translate when route/page changes
  React.useEffect(() => {
    if (enableAutoTranslation && language !== "en") {
      // Wait for new page content to load before translating
      const timeoutId = setTimeout(() => {
        translateCurrentPage();
      }, 300); // Slightly longer delay for page transitions
      return () => clearTimeout(timeoutId);
    }
  }, [pathname, enableAutoTranslation, language, translateCurrentPage]);

  // Handle language change
  const handleLanguageChange = React.useCallback((newLanguage: Language) => {
    // If switching to a different language, restore original first
    if (hasTranslatedContent) {
      restoreToOriginal();
    }
    setLanguage(newLanguage);
  }, [hasTranslatedContent, restoreToOriginal]);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage: handleLanguageChange,
      t: translations[language],
      isTranslating,
      enableAutoTranslation,
      setEnableAutoTranslation,
      availableLanguages,
      translateCurrentPage,
      restoreToOriginal,
      translationProgress,
      hasTranslatedContent,
      cancelTranslation,
    }),
    [
      language,
      handleLanguageChange,
      isTranslating,
      enableAutoTranslation,
      availableLanguages,
      translateCurrentPage,
      restoreToOriginal,
      translationProgress,
      hasTranslatedContent,
      cancelTranslation,
    ]
  );

  return (
    <GlobalTranslationContext.Provider value={value}>
      {children}
    </GlobalTranslationContext.Provider>
  );
}

export function useGlobalTranslation() {
  const context = React.useContext(GlobalTranslationContext);
  if (context === undefined) {
    throw new Error("useGlobalTranslation must be used within a GlobalTranslationProvider");
  }
  return context;
}

// Backward compatibility hook
export function useLanguage() {
  const context = useGlobalTranslation();
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t: context.t,
  };
}

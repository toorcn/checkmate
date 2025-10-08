import { TranslateTextCommand } from "@aws-sdk/client-translate";
import { translate } from "./aws";

/**
 * Supported languages for AWS Translate
 */
export const SUPPORTED_LANGUAGES = {
  en: "en", // English
  ms: "ms", // Malay
  zh: "zh", // Chinese (Simplified)
  "zh-cn": "zh", // Chinese (Simplified) - alias
  "zh-tw": "zh-TW", // Chinese (Traditional)
  es: "es", // Spanish
  fr: "fr", // French
  de: "de", // German
  ja: "ja", // Japanese
  ko: "ko", // Korean
  ar: "ar", // Arabic
  hi: "hi", // Hindi
  pt: "pt", // Portuguese
  ru: "ru", // Russian
  it: "it", // Italian
  th: "th", // Thai
  vi: "vi", // Vietnamese
  id: "id", // Indonesian
  tl: "tl", // Filipino
  tr: "tr", // Turkish
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Language detection based on content analysis
 */
export const detectLanguage = (text: string): string => {
  // Simple heuristic-based language detection
  // In production, you might want to use AWS Comprehend's language detection
  
  // Check for Chinese characters
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  
  // Check for common Malay words
  const malayWords = ["dan", "atau", "yang", "ini", "itu", "adalah", "untuk", "dari", "ke", "akan"];
  const words = text.toLowerCase().split(/\s+/);
  const malayCount = words.filter(word => malayWords.includes(word)).length;
  if (malayCount > words.length * 0.1) return "ms";
  
  // Default to English
  return "en";
};

/**
 * Cache for translations to avoid repeated API calls
 */
const translationCache = new Map<string, string>();

/**
 * Generate cache key for translation
 */
const getCacheKey = (text: string, sourceLanguage: string, targetLanguage: string): string => {
  return `${sourceLanguage}-${targetLanguage}-${text.slice(0, 100)}`;
};

/**
 * Translate text using AWS Translate
 */
export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<{ translatedText: string; sourceLanguage: string }> => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(text, sourceLanguage, targetLanguage);
    const cached = translationCache.get(cacheKey);
    if (cached) {
      return { translatedText: cached, sourceLanguage };
    }

    // If source and target are the same, return original text
    if (sourceLanguage === targetLanguage) {
      return { translatedText: text, sourceLanguage };
    }

    // Auto-detect language if not specified
    let detectedSourceLanguage = sourceLanguage;
    if (sourceLanguage === "auto") {
      detectedSourceLanguage = detectLanguage(text);
      
      // If detected language is same as target, return original
      if (detectedSourceLanguage === targetLanguage) {
        return { translatedText: text, sourceLanguage: detectedSourceLanguage };
      }
    }

    // Validate target language is supported
    const targetLangCode = SUPPORTED_LANGUAGES[targetLanguage as SupportedLanguage] || targetLanguage;
    const sourceLangCode = SUPPORTED_LANGUAGES[detectedSourceLanguage as SupportedLanguage] || detectedSourceLanguage;

    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: sourceLangCode,
      TargetLanguageCode: targetLangCode,
    });

    const response = await translate.send(command);
    const translatedText = response.TranslatedText || text;

    // Cache the result
    translationCache.set(cacheKey, translatedText);

    return { 
      translatedText, 
      sourceLanguage: response.SourceLanguageCode || detectedSourceLanguage 
    };
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return { translatedText: text, sourceLanguage };
  }
};

/**
 * Translate multiple texts in parallel
 */
export const translateTexts = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<Array<{ translatedText: string; sourceLanguage: string }>> => {
  const promises = texts.map(text => translateText(text, targetLanguage, sourceLanguage));
  return await Promise.all(promises);
};

/**
 * Translate analysis results
 */
export interface TranslatableAnalysisResult {
  transcription?: {
    text: string;
    language?: string;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  };
  metadata: {
    title: string;
    description: string;
    creator: string;
    originalUrl: string;
    platform: string;
  };
  factCheck?: {
    verdict: string;
    confidence: number;
    explanation: string;
    content: string;
    sources: Array<{
      title: string;
      url: string;
      credibility: number;
    }>;
    flags: string[];
    originTracing?: any;
    beliefDrivers?: any;
  };
  newsDetection?: {
    hasNewsContent: boolean;
    confidence: number;
    newsKeywordsFound: string[];
    potentialClaims: string[];
    needsFactCheck: boolean;
    contentType: string;
  };
}

/**
 * Translate analysis result to target language
 */
export const translateAnalysisResult = async (
  analysisResult: TranslatableAnalysisResult,
  targetLanguage: string
): Promise<TranslatableAnalysisResult> => {
  try {
    const translations: TranslatableAnalysisResult = { ...analysisResult };

    // Translate transcription
    if (analysisResult.transcription?.text) {
      const transcriptionTranslation = await translateText(
        analysisResult.transcription.text,
        targetLanguage,
        analysisResult.transcription.language || "auto"
      );
      translations.transcription = {
        ...analysisResult.transcription,
        text: transcriptionTranslation.translatedText,
      };

      // Translate segments if available
      if (analysisResult.transcription.segments) {
        const segmentTexts = analysisResult.transcription.segments.map(s => s.text);
        const translatedSegments = await translateTexts(segmentTexts, targetLanguage);
        translations.transcription.segments = analysisResult.transcription.segments.map((segment, index) => ({
          ...segment,
          text: translatedSegments[index].translatedText,
        }));
      }
    }

    // Translate metadata
    const metadataTranslations = await translateTexts(
      [analysisResult.metadata.title, analysisResult.metadata.description],
      targetLanguage
    );
    translations.metadata = {
      ...analysisResult.metadata,
      title: metadataTranslations[0].translatedText,
      description: metadataTranslations[1].translatedText,
    };

    // Translate fact check results
    if (analysisResult.factCheck) {
      const factCheckTexts = [
        analysisResult.factCheck.explanation,
        analysisResult.factCheck.content,
      ];
      const factCheckTranslations = await translateTexts(factCheckTexts, targetLanguage);
      
      // Translate source titles
      const sourceTitles = analysisResult.factCheck.sources.map(s => s.title);
      const translatedSourceTitles = await translateTexts(sourceTitles, targetLanguage);

      translations.factCheck = {
        ...analysisResult.factCheck,
        explanation: factCheckTranslations[0].translatedText,
        content: factCheckTranslations[1].translatedText,
        sources: analysisResult.factCheck.sources.map((source, index) => ({
          ...source,
          title: translatedSourceTitles[index].translatedText,
        })),
      };
    }

    // Translate news detection keywords and claims
    if (analysisResult.newsDetection) {
      const claimsTranslations = await translateTexts(
        analysisResult.newsDetection.potentialClaims,
        targetLanguage
      );
      
      translations.newsDetection = {
        ...analysisResult.newsDetection,
        potentialClaims: claimsTranslations.map(t => t.translatedText),
      };
    }

    return translations;
  } catch (error) {
    console.error("Error translating analysis result:", error);
    return analysisResult; // Return original if translation fails
  }
};

/**
 * Batch translate interface text elements
 */
export const translateUIElements = async (
  elements: Record<string, string>,
  targetLanguage: string
): Promise<Record<string, string>> => {
  try {
    const keys = Object.keys(elements);
    const texts = Object.values(elements);
    
    const translations = await translateTexts(texts, targetLanguage);
    
    const result: Record<string, string> = {};
    keys.forEach((key, index) => {
      result[key] = translations[index].translatedText;
    });
    
    return result;
  } catch (error) {
    console.error("Error translating UI elements:", error);
    return elements; // Return original if translation fails
  }
};

/**
 * Clear translation cache (useful for memory management)
 */
export const clearTranslationCache = (): void => {
  translationCache.clear();
};

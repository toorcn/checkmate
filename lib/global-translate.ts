import { TranslateTextCommand } from "@aws-sdk/client-translate";
import { translate } from "./aws";

/**
 * Global translation system that can translate entire page content
 */

export const SUPPORTED_LANGUAGES = {
  en: { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  ms: { code: "ms", name: "Malay", nativeName: "Bahasa Malaysia", flag: "🇲🇾" },
  zh: { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation cache with expiry
interface CacheEntry {
  translatedText: string;
  timestamp: number;
  sourceLanguage: string;
}

const translationCache = new Map<string, CacheEntry>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of translationCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRY) {
      translationCache.delete(key);
    }
  }
};

/**
 * Generate cache key for translation
 */
const getCacheKey = (text: string, sourceLanguage: string, targetLanguage: string): string => {
  // Create a simple hash for longer content to keep keys manageable
  let textKey: string;
  
  if (text.length > 100) {
    // For long text, create a simple hash using character codes
    let hash = 0;
    const sample = text.slice(0, 50) + text.slice(-50);
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    textKey = `hash_${Math.abs(hash).toString(36)}`;
  } else {
    // For short text, use URL-safe encoding
    textKey = encodeURIComponent(text).replace(/%/g, '_');
  }
  
  return `${sourceLanguage}-${targetLanguage}-${textKey}`;
};

/**
 * Detect language from text content
 */
export const detectLanguage = (text: string): string => {
  // Simple heuristic-based language detection
  const cleanText = text.toLowerCase().trim();
  
  // Check for Chinese characters
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  
  // Check for common Malay words
  const malayWords = ["dan", "atau", "yang", "ini", "itu", "adalah", "untuk", "dari", "ke", "akan", "dengan", "pada", "sebagai"];
  const words = cleanText.split(/\s+/);
  const malayCount = words.filter(word => malayWords.includes(word)).length;
  if (malayCount > words.length * 0.15) return "ms";
  
  // Default to English
  return "en";
};

/**
 * Translate text using AWS Translate (server-side for Node.js environment)
 * This function is only available on the server side
 */
export const translateTextServer = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<{ translatedText: string; sourceLanguage: string }> => {
  try {
    // Clean expired cache entries periodically
    if (Math.random() < 0.1) clearExpiredCache();

    // Auto-detect language if not specified
    let detectedSourceLanguage = sourceLanguage;
    if (sourceLanguage === "auto") {
      detectedSourceLanguage = detectLanguage(text);
    }

    // If source and target are the same, return original text
    if (detectedSourceLanguage === targetLanguage) {
      return { translatedText: text, sourceLanguage: detectedSourceLanguage };
    }

    // Check cache first
    const cacheKey = getCacheKey(text, detectedSourceLanguage, targetLanguage);
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return { translatedText: cached.translatedText, sourceLanguage: cached.sourceLanguage };
    }

    // Skip translation for very short or non-text content
    if (text.length < 3 || /^[\d\s\-.,!?]+$/.test(text)) {
      return { translatedText: text, sourceLanguage: detectedSourceLanguage };
    }

    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: detectedSourceLanguage,
      TargetLanguageCode: targetLanguage,
    });

    const response = await translate.send(command);
    const translatedText = response.TranslatedText || text;

    // Cache the result
    translationCache.set(cacheKey, {
      translatedText,
      timestamp: Date.now(),
      sourceLanguage: response.SourceLanguageCode || detectedSourceLanguage,
    });

    return { 
      translatedText, 
      sourceLanguage: response.SourceLanguageCode || detectedSourceLanguage 
    };
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return { translatedText: text, sourceLanguage: sourceLanguage === "auto" ? "en" : sourceLanguage };
  }
};

/**
 * Translate text using API route (client-side safe)
 */
export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<{ translatedText: string; sourceLanguage: string }> => {
  try {
    // Auto-detect language if not specified
    let detectedSourceLanguage = sourceLanguage;
    if (sourceLanguage === "auto") {
      detectedSourceLanguage = detectLanguage(text);
    }

    // If source and target are the same, return original text
    if (detectedSourceLanguage === targetLanguage) {
      return { translatedText: text, sourceLanguage: detectedSourceLanguage };
    }

    // Check cache first (client-side cache)
    const cacheKey = getCacheKey(text, detectedSourceLanguage, targetLanguage);
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return { translatedText: cached.translatedText, sourceLanguage: cached.sourceLanguage };
    }

    // Skip translation for very short or non-text content
    if (text.length < 3 || /^[\d\s\-.,!?]+$/.test(text)) {
      return { translatedText: text, sourceLanguage: detectedSourceLanguage };
    }

    // Call API route for translation
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage: detectedSourceLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Translation failed');
    }

    const { translatedText, sourceLanguage: detectedLang } = result.data;

    // Cache the result
    translationCache.set(cacheKey, {
      translatedText,
      timestamp: Date.now(),
      sourceLanguage: detectedLang || detectedSourceLanguage,
    });

    return { 
      translatedText, 
      sourceLanguage: detectedLang || detectedSourceLanguage 
    };
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return { translatedText: text, sourceLanguage: sourceLanguage === "auto" ? "en" : sourceLanguage };
  }
};

/**
 * Extract and translate all text content from DOM elements
 */
export const translatePageContent = async (
  targetLanguage: string,
  excludeSelectors: string[] = []
): Promise<Map<string, string>> => {
  const translations = new Map<string, string>();
  
  // Skip if target is English (our default language)
  if (targetLanguage === "en") return translations;

  // Default selectors to exclude from translation
  const defaultExcludeSelectors = [
    'script',
    'style', 
    'code',
    'pre',
    '[data-no-translate]',
    '[data-translated]',
    '.no-translate',
    'input',
    'textarea',
    'select',
    '[contenteditable]',
    '.translation-toggle',
    '[role="button"]',
    'button[aria-label]',
    ...excludeSelectors
  ];

  // Get all text nodes in the document
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip if parent element should be excluded
        let parent = node.parentElement;
        while (parent) {
          for (const selector of defaultExcludeSelectors) {
            if (parent.matches?.(selector)) {
              return NodeFilter.FILTER_REJECT;
            }
          }
          parent = parent.parentElement;
        }
        
        // Skip empty or whitespace-only text
        const text = node.textContent?.trim();
        if (!text || text.length < 3) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip if already translated
        if (node.parentElement?.dataset.translated === "true") {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: Text[] = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // Group text nodes by content to reduce API calls
  const textGroups = new Map<string, Text[]>();
  for (const textNode of textNodes) {
    const text = textNode.textContent?.trim();
    if (text) {
      if (!textGroups.has(text)) {
        textGroups.set(text, []);
      }
      textGroups.get(text)!.push(textNode);
    }
  }

  // Translate unique text content
  const translationPromises = Array.from(textGroups.keys()).map(async (text) => {
    try {
      const result = await translateText(text, targetLanguage);
      return { originalText: text, translatedText: result.translatedText };
    } catch (error) {
      console.error("Failed to translate text:", text, error);
      return { originalText: text, translatedText: text };
    }
  });

  const translationResults = await Promise.all(translationPromises);

  // Apply translations to DOM
  for (const { originalText, translatedText } of translationResults) {
    translations.set(originalText, translatedText);
    
    const nodes = textGroups.get(originalText) || [];
    for (const textNode of nodes) {
      if (textNode.textContent?.trim() === originalText) {
        textNode.textContent = translatedText;
        // Mark as translated
        if (textNode.parentElement) {
          textNode.parentElement.dataset.translated = "true";
          textNode.parentElement.dataset.originalText = originalText;
        }
      }
    }
  }

  return translations;
};

/**
 * Restore original text content
 */
export const restoreOriginalContent = () => {
  const translatedElements = document.querySelectorAll('[data-translated="true"]') as NodeListOf<HTMLElement>;
  
  for (const element of translatedElements) {
    const originalText = element.dataset.originalText;
    if (originalText) {
      // Find text nodes and restore original content
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let textNode;
      while ((textNode = walker.nextNode())) {
        if (textNode.textContent?.trim()) {
          textNode.textContent = originalText;
          break;
        }
      }
    }
    
    // Remove translation markers
    delete element.dataset.translated;
    delete element.dataset.originalText;
  }
};

/**
 * Batch translate multiple texts (server-side)
 */
export const translateTextsServer = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<Array<{ translatedText: string; sourceLanguage: string }>> => {
  // Process in batches to avoid overwhelming AWS Translate
  const batchSize = 10;
  const results: Array<{ translatedText: string; sourceLanguage: string }> = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => translateTextServer(text, targetLanguage, sourceLanguage));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Batch translate multiple texts (client-side via API)
 */
export const translateTexts = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<Array<{ translatedText: string; sourceLanguage: string }>> => {
  // Process in batches to avoid overwhelming the API
  const batchSize = 10;
  const results: Array<{ translatedText: string; sourceLanguage: string }> = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => translateText(text, targetLanguage, sourceLanguage));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Clear all translation cache
 */
export const clearTranslationCache = (): void => {
  translationCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    totalEntries: translationCache.size,
    memoryUsage: JSON.stringify(Array.from(translationCache.entries())).length,
  };
};

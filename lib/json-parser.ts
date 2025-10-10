/**
 * Utility functions for parsing JSON responses from AI models
 * Handles common formatting issues like markdown code fences
 */

/**
 * Safely parses JSON text that may contain markdown code fences or extra formatting
 * @param text - Raw text response that may contain JSON
 * @param fallback - Fallback object to return if parsing fails
 * @returns Parsed JSON object or fallback
 */
export function parseJsonResponse<T = any>(text: string, fallback: T): T {
  if (!text || typeof text !== 'string') {
    return fallback;
  }

  try {
    // Clean the response text by removing markdown code fences and extra whitespace
    let cleanedText = text.trim();
    
    // Remove markdown code fences (```json ... ```)
    if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(7, -3).trim();
    } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(3, -3).trim();
    }
    
    // Remove any remaining code fence markers
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '').trim();
    
    // Try to find JSON object boundaries if the text is mixed
    const start = cleanedText.indexOf('{');
    const end = cleanedText.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      cleanedText = cleanedText.slice(start, end + 1);
    }
    
    return JSON.parse(cleanedText || '{}');
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
    console.warn('Original text:', text.substring(0, 200) + '...');
    return fallback;
  }
}

/**
 * Extracts JSON from text that may contain mixed content
 * @param text - Text that may contain JSON mixed with other content
 * @param fallback - Fallback object to return if no JSON found
 * @returns Extracted JSON object or fallback
 */
export function extractJsonFromText<T = any>(text: string, fallback: T): T {
  if (!text || typeof text !== 'string') {
    return fallback;
  }

  try {
    // First try the full parsing approach
    const parsed = parseJsonResponse(text, null);
    if (parsed !== null) {
      return parsed;
    }

    // If that fails, try to extract JSON object boundaries
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      const jsonText = text.slice(start, end + 1);
      return JSON.parse(jsonText);
    }

    return fallback;
  } catch (error) {
    console.warn('Failed to extract JSON from text:', error);
    return fallback;
  }
}

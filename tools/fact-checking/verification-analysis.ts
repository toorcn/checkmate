import { generateText } from "ai";
import { textModel, DEFAULT_CLASSIFY_MAX_TOKENS, DEFAULT_CLASSIFY_TEMPERATURE } from "../../lib/ai";

/**
 * Analyzes verification status and confidence using LLM with comprehensive fact-check analysis.
 *
 * This function takes a claim and supporting research content, then uses AI to determine:
 * - Verification status (verified/misleading/unverifiable)
 * - Confidence level (0.0 to 1.0)
 *
 * **Important**: The analysis prioritizes PRIMARY claims over SECONDARY details. Content
 * is marked as "verified" if the core factual assertion is true, even if embellishments
 * or superlatives (e.g., "first ever", "only one") are inaccurate. This ensures the
 * fact-check focuses on the substantive claim rather than getting sidetracked by minor
 * exaggerations.
 *
 * The function includes intelligent fallbacks for when API keys are unavailable,
 * using keyword-based analysis as a backup method.
 *
 * @param claim - The original claim or content to be verified
 * @param searchContent - Research content and evidence from credible sources
 * @returns Promise resolving to verification status and confidence score
 *
 * @example
 * ```typescript
 * const result = await analyzeVerificationStatus(
 *   "Australia provides free education and is the first country ever to do so",
 *   "Research shows Australia does provide free education, but other countries did it first..."
 * );
 *
 * console.log(result.status); // "verified" (core claim is true)
 * console.log(result.confidence); // 0.85
 * ```
 */
export async function analyzeVerificationStatus(
  claim: string,
  searchContent: string
): Promise<{ status: string; confidence: number }> {
  if (!process.env.APP_REGION && !process.env.AWS_REGION) {
    /**
     * Fallback Analysis: Keyword-Based Assessment
     * When API is unavailable, uses basic keyword matching to determine status.
     * This provides a basic level of analysis even without AI capabilities.
     */
    const lowercaseContent = searchContent.toLowerCase();
    let status = "unverifiable";
    let confidence = 0.5;

    if (
      lowercaseContent.includes("verified") ||
      lowercaseContent.includes("confirmed") ||
      lowercaseContent.includes("accurate")
    ) {
      status = "verified";
      confidence = 0.7;
    } else if (lowercaseContent.includes("misleading")) {
      status = "misleading";
      confidence = 0.7;
    } else if (lowercaseContent.includes("unverifiable")) {
      status = "unverifiable";
      confidence = 0.6;
    }

    return { status, confidence };
  }

  try {
    /**
     * AI-Powered Verification Analysis
     * Uses GPT to analyze research content and determine verification status
     * with high accuracy and nuanced understanding of context.
     */
    const prompt = `Analyze the following fact-check research results for the claim: "${claim}"

Research Results:
${searchContent}

Based on the research evidence, determine:
1. Verification Status: Choose ONE of: "verified", "misleading", "unverifiable"
2. Confidence Level: A number from 0.0 to 1.0 representing how confident you are in this assessment

Guidelines:
- "verified": The PRIMARY/CORE claim is accurate and supported by evidence
  * Use this even if minor secondary details (like superlatives "first ever", "only one") are inaccurate
  * Focus on whether the main factual assertion is true
  * Example: "Australia offers free education" (verified) vs "first country to do so" (secondary detail)
  
- "misleading": The PRIMARY claim itself is substantially false, lacks critical context, or is deceptive
  * Use this when the core fact is wrong or presented in a way that creates false impressions
  * Do NOT use this just because embellishments or secondary details are inaccurate
  
- "unverifiable": Insufficient credible evidence to make a determination about the primary claim

**IMPORTANT**: Base your verdict on the PRIMARY claim, not embellishments or secondary details.

Respond in this exact JSON format:
{"status": "status_here", "confidence": 0.0}`;

    const { text: responseText } = await generateText({
      model: textModel(),
      prompt: prompt,
      maxTokens: DEFAULT_CLASSIFY_MAX_TOKENS,
      temperature: DEFAULT_CLASSIFY_TEMPERATURE,
    });

    try {
      /**
       * Parse AI Response and Extract Verification Data
       * Attempts to parse JSON response and validates the results.
       */
      const parsed = JSON.parse(responseText.trim() || "{}");
      const status = parsed.status || "unverifiable";
      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

      return { status, confidence };
    } catch {
      /**
       * JSON Parsing Fallback
       * If AI response isn't valid JSON, return safe defaults.
       */
      return { status: "unverifiable", confidence: 0.5 };
    }
  } catch (error) {
    /**
     * Error Handling and Logging
     * Logs errors for debugging while providing safe fallback response.
     */
    console.warn(`Failed to analyze verification status for claim:`, error);
    return { status: "unverifiable", confidence: 0.5 };
  }
}

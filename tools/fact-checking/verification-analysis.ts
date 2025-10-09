import { generateText } from "ai";
import { textModel, DEFAULT_CLASSIFY_MAX_TOKENS, DEFAULT_CLASSIFY_TEMPERATURE } from "../../lib/ai";

/**
 * Analyzes verification status and confidence using LLM with comprehensive fact-check analysis.
 *
 * This function takes a claim and supporting research content, then uses AI to determine:
 * - Verification status (verified/misleading/false/partially_true/outdated/exaggerated/opinion/rumor/conspiracy/debunked/satire)
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
    let status = "opinion";
    let confidence = 0.5;

    if (
      lowercaseContent.includes("verified") ||
      lowercaseContent.includes("confirmed") ||
      lowercaseContent.includes("accurate")
    ) {
      status = "verified";
      confidence = 0.7;
    } else if (lowercaseContent.includes("partially true") || lowercaseContent.includes("partially correct")) {
      status = "partially_true";
      confidence = 0.7;
    } else if (lowercaseContent.includes("misleading")) {
      status = "misleading";
      confidence = 0.7;
    } else if (lowercaseContent.includes("false") || lowercaseContent.includes("incorrect") || lowercaseContent.includes("wrong")) {
      status = "false";
      confidence = 0.7;
    } else if (lowercaseContent.includes("exaggerated") || lowercaseContent.includes("overstated")) {
      status = "exaggerated";
      confidence = 0.7;
    } else if (lowercaseContent.includes("outdated") || lowercaseContent.includes("superseded")) {
      status = "outdated";
      confidence = 0.7;
    } else if (lowercaseContent.includes("opinion") || lowercaseContent.includes("subjective")) {
      status = "opinion";
      confidence = 0.7;
    } else if (lowercaseContent.includes("rumor") || lowercaseContent.includes("unverified")) {
      status = "rumor";
      confidence = 0.7;
    } else if (lowercaseContent.includes("conspiracy") || lowercaseContent.includes("conspiracy theory")) {
      status = "conspiracy";
      confidence = 0.7;
    } else if (lowercaseContent.includes("debunked") || lowercaseContent.includes("disproven")) {
      status = "debunked";
      confidence = 0.8;
    } else if (lowercaseContent.includes("satire") || lowercaseContent.includes("parody") || lowercaseContent.includes("humor")) {
      status = "satire";
      confidence = 0.7;
    } else if (lowercaseContent.includes("unverifiable")) {
      status = "opinion";
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
1. Verification Status: Choose ONE of: "verified", "partially_true", "misleading", "false", "exaggerated", "outdated", "opinion", "rumor", "conspiracy", "debunked", "satire"
2. Confidence Level: A number from 0.0 to 1.0 representing how confident you are in this assessment

Guidelines:
- "verified": The PRIMARY/CORE claim is accurate and supported by evidence
  * Use this even if minor secondary details (like superlatives "first ever", "only one") are inaccurate
  * Focus on whether the main factual assertion is true
  * Example: "Australia offers free education" (verified) vs "first country to do so" (secondary detail)

- "partially_true": The claim contains both accurate and inaccurate elements
  * Use when some facts are correct but others are wrong or misleading
  * Example: "The vaccine causes autism" (partially true - vaccine exists, but autism claim is false)
  
- "misleading": The PRIMARY claim itself is substantially false, lacks critical context, or is deceptive
  * Use this when the core fact is wrong or presented in a way that creates false impressions
  * Do NOT use this just because embellishments or secondary details are inaccurate

- "false": The claim is demonstrably incorrect based on credible evidence
  * Use for clearly debunked claims with strong evidence against them
  * Example: "COVID-19 was created in a lab" (false - natural origin confirmed by scientists)

- "exaggerated": The claim contains truth but is overstated or sensationalized
  * Use when facts are stretched beyond what evidence supports
  * Example: "Millions died from vaccines" (exaggerated - some deaths occurred but not millions)

- "outdated": The claim was true at one time but is no longer accurate
  * Use for information that has been superseded by newer evidence
  * Example: "The Earth is flat" (outdated - disproven centuries ago)

- "opinion": The content expresses subjective views rather than factual claims
  * Use for personal beliefs, preferences, or subjective statements
  * Example: "This movie is terrible" (opinion - not a factual claim)

- "rumor": Unverified information circulating without credible sources
  * Use for unsubstantiated claims that lack reliable evidence
  * Example: "Celebrity X is getting divorced" (rumor - no confirmed sources)

- "conspiracy": Claims involving secret plots or hidden agendas without evidence
  * Use for theories about secretive groups controlling events
  * Example: "The government is hiding aliens" (conspiracy - no credible evidence)

- "debunked": Claims that have been thoroughly disproven by multiple sources
  * Use for claims with strong evidence against them from credible sources
  * Example: "Vaccines cause autism" (debunked - multiple studies disprove this)

- "satire": Content intended as humor or parody, not factual information
  * Use for comedic content that might be mistaken for real news
  * Example: "Man bites dog" from satirical news site (satire)

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
      const status = parsed.status || "opinion";
      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

      return { status, confidence };
    } catch {
      /**
       * JSON Parsing Fallback
       * If AI response isn't valid JSON, return safe defaults.
       */
      return { status: "opinion", confidence: 0.5 };
    }
  } catch (error) {
    /**
     * Error Handling and Logging
     * Logs errors for debugging while providing safe fallback response.
     */
    console.warn(`Failed to analyze verification status for claim:`, error);
    return { status: "opinion", confidence: 0.5 };
  }
}

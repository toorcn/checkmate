import { generateText } from "ai";
import { textModel, DEFAULT_CLASSIFY_MAX_TOKENS, DEFAULT_CLASSIFY_TEMPERATURE } from "../../lib/ai";
import { parseJsonResponse } from "../../lib/json-parser";

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
      status = "unverifiable";
      confidence = 0.6;
    }

    return { status, confidence };
  }

  // First, try to extract verdict directly from the detailed analysis if it exists
  const lowerContent = searchContent.toLowerCase();
  
  // Check if this looks like a detailed analysis (has markdown sections)
  const isDetailedAnalysis = searchContent.includes("**Primary Claim Verification**") || 
                              searchContent.includes("**DETAILED ANALYSIS") ||
                              searchContent.includes("Primary claim is");
  
  if (isDetailedAnalysis) {
    console.log("=== EXTRACTING VERDICT FROM DETAILED ANALYSIS ===");
    console.log("Analysis content preview:", searchContent.substring(0, 500));
    
    // Extract verdict from prose using regex patterns
    let status = "unverifiable";
    let confidence = 0.5;
    
    // Look for "Primary claim is **X**" pattern (case-insensitive)
    const primaryClaimMatch = searchContent.match(/primary claim (?:is|verification[:\s]+)(?:\s+)?(?:\*\*)?(\w+)(?:\*\*)?/i);
    if (primaryClaimMatch) {
      const extractedVerdict = primaryClaimMatch[1].toLowerCase();
      console.log("Extracted verdict from 'primary claim' pattern:", extractedVerdict);
      console.log("Full match:", primaryClaimMatch[0]);
      
      if (extractedVerdict === "false") {
        status = "false";
        confidence = 0.85;
      } else if (extractedVerdict === "true" || extractedVerdict === "verified") {
        status = "verified";
        confidence = 0.85;
      } else if (extractedVerdict === "misleading") {
        status = "misleading";
        confidence = 0.85;
      } else if (extractedVerdict === "partially") {
        // Look ahead for "partially true"
        if (searchContent.match(/partially\s+true/i)) {
          status = "partially_true";
          confidence = 0.85;
        }
      }
    } else {
      console.log("Primary claim pattern did not match, trying alternative patterns");
    }
    
    // If still unverifiable, try other patterns
    if (status === "unverifiable") {
      if (lowerContent.match(/claim is\s+(?:\*\*)?false(?:\*\*)?/i)) {
        status = "false";
        confidence = 0.85;
      } else if (lowerContent.match(/claim is\s+(?:\*\*)?misleading(?:\*\*)?/i)) {
        status = "misleading";
        confidence = 0.85;
      } else if (lowerContent.match(/claim is\s+(?:\*\*)?(?:true|verified)(?:\*\*)?/i)) {
        status = "verified";
        confidence = 0.85;
      } else if (lowerContent.match(/claim is\s+(?:\*\*)?partially\s+true(?:\*\*)?/i)) {
        status = "partially_true";
        confidence = 0.85;
      } else if (lowerContent.match(/(?:\*\*)?exaggerated(?:\*\*)?/i)) {
        status = "exaggerated";
        confidence = 0.8;
      } else if (lowerContent.match(/(?:\*\*)?satire(?:\*\*)?/i) || lowerContent.includes("satirical")) {
        status = "satire";
        confidence = 0.8;
      } else if (lowerContent.match(/(?:\*\*)?debunked(?:\*\*)?/i)) {
        status = "debunked";
        confidence = 0.85;
      } else if (lowerContent.match(/(?:\*\*)?outdated(?:\*\*)?/i)) {
        status = "outdated";
        confidence = 0.8;
      } else if (lowerContent.match(/(?:\*\*)?opinion(?:\*\*)?/i)) {
        status = "opinion";
        confidence = 0.8;
      } else if (lowerContent.match(/(?:\*\*)?rumor(?:\*\*)?/i)) {
        status = "rumor";
        confidence = 0.75;
      } else if (lowerContent.match(/(?:\*\*)?conspiracy(?:\*\*)?/i)) {
        status = "conspiracy";
        confidence = 0.8;
      }
    }
    
    console.log("Extracted verdict from detailed analysis:", status, "confidence:", confidence);
    
    if (status !== "unverifiable") {
      return { status, confidence };
    }
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
1. Verification Status: Choose ONE of: "verified", "partially_true", "misleading", "false", "exaggerated", "outdated", "opinion", "rumor", "conspiracy", "debunked", "satire", "unverifiable"
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
  
- "unverifiable": Insufficient credible evidence to make a determination about the primary claim

**IMPORTANT**: Base your verdict on the PRIMARY claim, not embellishments or secondary details.

Respond in this exact JSON format:
{"status": "status_here", "confidence": 0.0}`;

    const { text: responseText } = await generateText({
      model: textModel(),
      prompt: prompt,
      maxTokens: 200, // Increased from DEFAULT_CLASSIFY_MAX_TOKENS to ensure complete JSON response
      temperature: DEFAULT_CLASSIFY_TEMPERATURE,
    });

    try {
      /**
       * Parse AI Response and Extract Verification Data
       * Attempts to parse JSON response and validates the results.
       */
      console.log("=== VERIFICATION ANALYSIS DEBUG ===");
      console.log("Raw AI response:", responseText);
      
      const parsed = parseJsonResponse(responseText, { status: "unverifiable", confidence: 0.5 });
      console.log("Parsed JSON:", parsed);
      
      const status = parsed.status || "unverifiable";
      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

      console.log("Final status:", status, "confidence:", confidence);
      return { status, confidence };
    } catch (parseError) {
      /**
       * JSON Parsing Fallback
       * If AI response isn't valid JSON, try to extract verdict from prose text
       */
      console.error("JSON parsing failed, attempting prose extraction:", parseError);
      console.log("Response text to extract from:", responseText.substring(0, 500));
      
      // Try to extract verdict from prose text
      const lowerText = responseText.toLowerCase();
      let status = "unverifiable";
      let confidence = 0.5;
      
      // Look for explicit verdict statements in the text
      // Check for markdown bold patterns first (e.g., "is **false**")
      if (lowerText.match(/is\s+\*\*false\*\*/i) || lowerText.match(/claim is false/i) || lowerText.match(/primary claim.*false/i)) {
        status = "false";
        confidence = 0.85;
        console.log("Detected 'false' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*true\*\*/i) || lowerText.match(/is\s+\*\*verified\*\*/i) || lowerText.match(/claim is (true|verified)/i) || lowerText.match(/primary claim.*(true|verified)/i)) {
        status = "verified";
        confidence = 0.85;
        console.log("Detected 'verified' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*misleading\*\*/i) || lowerText.match(/claim is misleading/i) || lowerText.match(/primary claim.*misleading/i)) {
        status = "misleading";
        confidence = 0.85;
        console.log("Detected 'misleading' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*partially\s*true\*\*/i) || lowerText.match(/claim is partially true/i) || lowerText.match(/partially correct/i)) {
        status = "partially_true";
        confidence = 0.8;
        console.log("Detected 'partially_true' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*exaggerated\*\*/i) || lowerText.match(/claim is exaggerated/i)) {
        status = "exaggerated";
        confidence = 0.8;
        console.log("Detected 'exaggerated' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*satire\*\*/i) || lowerText.match(/satirical/i)) {
        status = "satire";
        confidence = 0.8;
        console.log("Detected 'satire' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*debunked\*\*/i) || lowerText.match(/has been debunked/i)) {
        status = "debunked";
        confidence = 0.85;
        console.log("Detected 'debunked' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*outdated\*\*/i) || lowerText.match(/claim is outdated/i)) {
        status = "outdated";
        confidence = 0.8;
        console.log("Detected 'outdated' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*opinion\*\*/i) || lowerText.match(/is an opinion/i)) {
        status = "opinion";
        confidence = 0.8;
        console.log("Detected 'opinion' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*rumor\*\*/i) || lowerText.match(/is a rumor/i)) {
        status = "rumor";
        confidence = 0.7;
        console.log("Detected 'rumor' verdict from prose");
      } else if (lowerText.match(/is\s+\*\*conspiracy\*\*/i) || lowerText.match(/conspiracy theory/i)) {
        status = "conspiracy";
        confidence = 0.8;
        console.log("Detected 'conspiracy' verdict from prose");
      } else {
        console.log("No clear verdict found in prose, defaulting to unverifiable");
      }
      
      console.log("Final extracted verdict - status:", status, "confidence:", confidence);
      return { status, confidence };
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

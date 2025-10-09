import { tool, generateText } from "ai";
import { z } from "zod";
import { textModel, DEFAULT_ANALYSIS_MAX_TOKENS, DEFAULT_ANALYSIS_TEMPERATURE } from "../../../lib/ai";

/**
 * Dedicated Credibility Verification Agent
 * 
 * This agent focuses specifically on verifying creator claims against provided sources
 * and determining the credibility of the content creator based on:
 * 1. Accuracy of claims made
 * 2. Quality and relevance of sources used
 * 3. Consistency between claims and evidence
 * 4. Overall trustworthiness assessment
 */
export const credibilityVerificationAgent = tool({
  description: "Verify creator credibility by analyzing claims against provided sources and determining overall trustworthiness",
  parameters: z.object({
    creatorInfo: z.object({
      name: z.string(),
      platform: z.string(),
      handle: z.string().optional(),
    }),
    claim: z.string().describe("The specific claim or statement made by the creator"),
    sources: z.array(z.object({
      url: z.string(),
      title: z.string(),
      relevance: z.number().min(0).max(1).describe("Relevance score 0-1"),
      credibility: z.number().min(0).max(10).optional().describe("Source credibility 0-10"),
    })).describe("Sources provided to support or refute the claim"),
    context: z.string().optional().describe("Additional context about the claim or content"),
  }),
  execute: async ({ creatorInfo, claim, sources, context }) => {
    try {
      // Check if AI model is available
      if (!process.env.BEDROCK_MODEL_ID) {
        return {
          success: false,
          error: "AI model not configured - BEDROCK_MODEL_ID required",
        };
      }

      // Prepare source analysis
      const sourceAnalysis = sources.map(source => ({
        title: source.title,
        url: source.url,
        relevance: source.relevance,
        credibility: source.credibility || Math.round(source.relevance * 10),
        quality: source.relevance > 0.7 ? "high" : source.relevance > 0.4 ? "medium" : "low"
      }));

      const highQualitySources = sourceAnalysis.filter(s => s.quality === "high").length;
      const totalSources = sources.length;
      const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / totalSources;

      const verificationPrompt = `You are a credibility verification specialist. Your job is to analyze a creator's claim against the sources they provide and determine:

1. **CLAIM ACCURACY**: Is the specific claim made by the creator accurate based on the sources?
2. **SOURCE QUALITY**: Are the sources credible and relevant to the claim?
3. **CREATOR TRUSTWORTHINESS**: How trustworthy is this creator based on their claim and evidence?

**CREATOR INFO:**
- Name: ${creatorInfo.name}
- Platform: ${creatorInfo.platform}
- Handle: ${creatorInfo.handle || "N/A"}

**CLAIM TO VERIFY:**
"${claim}"

**CONTEXT:**
${context || "No additional context provided"}

**SOURCES PROVIDED:**
${sourceAnalysis.map((source, i) => `
${i + 1}. **${source.title}**
   - URL: ${source.url}
   - Relevance: ${source.relevance.toFixed(2)} (${source.quality} quality)
   - Credibility: ${source.credibility}/10
`).join('\n')}

**SOURCE STATISTICS:**
- Total sources: ${totalSources}
- High quality sources: ${highQualitySources}
- Average relevance: ${avgRelevance.toFixed(2)}

**ANALYSIS REQUIREMENTS:**

1. **Claim Verification**: 
   - Does the claim match what the sources actually say?
   - Are there any exaggerations or misrepresentations?
   - Is the claim supported by the evidence provided?

2. **Source Assessment**:
   - Are the sources credible and authoritative?
   - Do they directly support the claim?
   - Are there any red flags in the sources?

3. **Creator Credibility**:
   - How accurately does the creator represent the information?
   - Do they provide proper context and nuance?
   - Are they transparent about their sources?

**VERDICT CATEGORIES:**
- **HIGHLY_CREDIBLE**: Claim is accurate, sources are excellent, creator is trustworthy
- **CREDIBLE**: Claim is mostly accurate, good sources, minor issues
- **PARTIALLY_CREDIBLE**: Claim has some accuracy issues or source problems
- **LOW_CREDIBILITY**: Significant accuracy problems or poor sources
- **NOT_CREDIBLE**: Claim is false or severely misleading

**CONFIDENCE LEVELS:**
- **HIGH (80-100%)**: Very clear evidence and sources
- **MEDIUM (60-79%)**: Good evidence with some uncertainty
- **LOW (40-59%)**: Limited or questionable evidence
- **VERY_LOW (0-39%)**: Insufficient or conflicting evidence

Respond with a JSON object containing:
{
  "verdict": "one of the verdict categories",
  "confidence": number between 0 and 100,
  "claimAccuracy": "accurate" | "mostly_accurate" | "partially_accurate" | "inaccurate" | "misleading",
  "sourceQuality": "excellent" | "good" | "fair" | "poor",
  "creatorTrustworthiness": "high" | "medium" | "low",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "issues": ["issue1", "issue2"] or [],
  "strengths": ["strength1", "strength2"] or [],
  "recommendation": "trust" | "verify_independently" | "be_cautious" | "do_not_trust",
  "explanation": "detailed explanation of the analysis and reasoning"
}`;

      const { text: responseText } = await generateText({
        model: textModel(),
        system: "You are an expert credibility verification specialist who analyzes creator claims against their sources with precision and objectivity.",
        prompt: verificationPrompt,
        maxTokens: DEFAULT_ANALYSIS_MAX_TOKENS,
        temperature: DEFAULT_ANALYSIS_TEMPERATURE,
      });

      try {
        // Parse the AI response
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
          throw new Error("No valid JSON found in response");
        }

        const jsonResponse = responseText.slice(startIndex, endIndex + 1);
        const parsed = JSON.parse(jsonResponse);

        // Validate and normalize the response
        const verdict = parsed.verdict || "LOW_CREDIBILITY";
        const confidence = Math.max(0, Math.min(100, parsed.confidence || 50));
        const claimAccuracy = parsed.claimAccuracy || "partially_accurate";
        const sourceQuality = parsed.sourceQuality || "fair";
        const creatorTrustworthiness = parsed.creatorTrustworthiness || "low";
        const keyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [];
        const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
        const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
        const recommendation = parsed.recommendation || "verify_independently";
        const explanation = parsed.explanation || "Analysis completed";

        // Calculate credibility score based on verdict and confidence
        let credibilityScore = 5.0; // Default baseline
        
        switch (verdict) {
          case "HIGHLY_CREDIBLE":
            credibilityScore = 8.0 + (confidence / 100) * 2.0; // 8.0-10.0
            break;
          case "CREDIBLE":
            credibilityScore = 6.0 + (confidence / 100) * 2.0; // 6.0-8.0
            break;
          case "PARTIALLY_CREDIBLE":
            credibilityScore = 4.0 + (confidence / 100) * 2.0; // 4.0-6.0
            break;
          case "LOW_CREDIBILITY":
            credibilityScore = 2.0 + (confidence / 100) * 2.0; // 2.0-4.0
            break;
          case "NOT_CREDIBLE":
            credibilityScore = 0.0 + (confidence / 100) * 2.0; // 0.0-2.0
            break;
        }

        return {
          success: true,
          data: {
            verdict,
            confidence,
            credibilityScore: Math.round(credibilityScore * 10) / 10,
            claimAccuracy,
            sourceQuality,
            creatorTrustworthiness,
            keyFindings,
            issues,
            strengths,
            recommendation,
            explanation,
            sourceAnalysis: {
              totalSources,
              highQualitySources,
              averageRelevance: avgRelevance,
              sourceBreakdown: sourceAnalysis,
            },
            creator: creatorInfo.name,
            platform: creatorInfo.platform,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (parseError) {
        console.warn("Failed to parse AI response:", parseError);
        return {
          success: false,
          error: "Failed to parse verification analysis response",
          fallback: {
            verdict: "PARTIALLY_CREDIBLE",
            confidence: 50,
            credibilityScore: 5.0,
            explanation: "Unable to parse detailed analysis, using fallback assessment",
          },
        };
      }
    } catch (error) {
      console.error("Credibility verification failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during verification",
      };
    }
  },
});

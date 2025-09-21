import { generateText } from "ai";
import { textModel, DEFAULT_CLASSIFY_MAX_TOKENS, DEFAULT_CLASSIFY_TEMPERATURE } from "../../lib/ai";

/**
 * Political bias analysis result interface
 */
export interface PoliticalBiasResult {
  /** Overall bias direction: left, right, center, or none */
  biasDirection: "left" | "right" | "center" | "none";
  /** Bias intensity from 0 (no bias) to 1 (extreme bias) */
  biasIntensity: number;
  /** Confidence in the bias assessment from 0 to 1 */
  confidence: number;
  /** Detailed explanation of the bias analysis */
  explanation: string;
  /** Specific indicators that suggest political bias */
  biasIndicators: string[];
  /** Political topics or themes detected */
  politicalTopics: string[];
}

/**
 * Analyzes content for political bias using AI-powered analysis.
 *
 * This function evaluates content to detect:
 * - Political lean (left, right, center, none)
 * - Intensity of bias
 * - Specific bias indicators
 * - Political themes and topics
 *
 * The function includes fallbacks for when API keys are unavailable,
 * using keyword-based analysis as a backup method.
 *
 * @param content - The content to analyze for political bias
 * @param context - Optional context about the content source
 * @returns Promise resolving to political bias analysis
 *
 * @example
 * ```typescript
 * const result = await analyzePoliticalBias(
 *   "The mainstream media refuses to report on this issue...",
 *   "Social media post about election coverage"
 * );
 *
 * console.log(result.biasDirection); // "right"
 * console.log(result.biasIntensity); // 0.7
 * console.log(result.confidence); // 0.85
 * ```
 */
export async function analyzePoliticalBias(
  content: string,
  context?: string
): Promise<PoliticalBiasResult> {
  // Fallback analysis when API is not available
  if (!process.env.APP_REGION && !process.env.AWS_REGION) {
    return performKeywordBasedBiasAnalysis(content);
  }

  try {
    const prompt = `Analyze the following content for political bias. Consider language patterns, framing, topic selection, and ideological indicators.

Content to analyze:
${content}

${context ? `Context: ${context}` : ""}

Evaluate the content for:
1. Political bias direction (left, right, center, or none)
2. Intensity of bias (0.0 = no bias, 1.0 = extreme bias)
3. Confidence in assessment (0.0 = very uncertain, 1.0 = very confident)
4. Specific indicators that suggest bias
5. Political topics or themes present

Guidelines:
- "left": Progressive/liberal bias (pro-government intervention, social justice focus, anti-conservative framing)
- "right": Conservative bias (pro-traditional values, anti-government overreach, pro-business framing)
- "center": Balanced or moderate perspectives
- "none": Non-political content or neutral reporting

Consider these bias indicators:
- Loaded language and emotional framing
- Selective fact presentation
- Source selection patterns
- Talking points alignment with political movements
- Us vs. them framing
- Conspiracy theories or partisan narratives
- Anti-establishment rhetoric (can lean either direction)

Respond in this exact JSON format:
{
  "biasDirection": "left|right|center|none",
  "biasIntensity": 0.0,
  "confidence": 0.0,
  "explanation": "Detailed analysis of bias patterns found",
  "biasIndicators": ["indicator1", "indicator2"],
  "politicalTopics": ["topic1", "topic2"]
}`;

    const { text: responseText } = await generateText({
      model: textModel(),
      prompt: prompt,
      maxTokens: DEFAULT_CLASSIFY_MAX_TOKENS,
      temperature: DEFAULT_CLASSIFY_TEMPERATURE,
    });

    try {
      const parsed = JSON.parse(responseText.trim() || "{}");
      
      // Validate and normalize the response
      return {
        biasDirection: validateBiasDirection(parsed.biasDirection),
        biasIntensity: Math.max(0, Math.min(1, parsed.biasIntensity || 0)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        explanation: parsed.explanation || "Political bias analysis completed using AI assessment.",
        biasIndicators: Array.isArray(parsed.biasIndicators) ? parsed.biasIndicators : [],
        politicalTopics: Array.isArray(parsed.politicalTopics) ? parsed.politicalTopics : [],
      };
    } catch (parseError) {
      console.warn("Failed to parse political bias analysis response:", parseError);
      return performKeywordBasedBiasAnalysis(content);
    }
  } catch (error) {
    console.warn("Failed to analyze political bias:", error);
    return performKeywordBasedBiasAnalysis(content);
  }
}

/**
 * Fallback keyword-based political bias analysis
 */
function performKeywordBasedBiasAnalysis(content: string): PoliticalBiasResult {
  const lowercaseContent = content.toLowerCase();
  
  // Left-leaning indicators
  const leftKeywords = [
    "social justice", "systemic racism", "climate change", "progressive",
    "medicare for all", "wealth inequality", "corporate greed", "fascist",
    "far-right", "extremist", "diversity", "inclusion", "lgbtq",
    "reproductive rights", "gun control", "minimum wage"
  ];
  
  // Right-leaning indicators
  const rightKeywords = [
    "mainstream media", "fake news", "deep state", "socialist",
    "communist", "radical left", "freedom", "patriot", "constitution",
    "second amendment", "traditional values", "law and order",
    "border security", "america first", "liberal bias", "woke"
  ];
  
  // Political topic indicators
  const politicalTopics = [
    "election", "trump", "biden", "democrat", "republican", "politics",
    "government", "congress", "senate", "supreme court", "immigration",
    "healthcare", "economy", "foreign policy"
  ];
  
  let leftScore = 0;
  let rightScore = 0;
  const detectedTopics: string[] = [];
  const indicators: string[] = [];
  
  // Count left-leaning keywords
  leftKeywords.forEach(keyword => {
    if (lowercaseContent.includes(keyword)) {
      leftScore++;
      indicators.push(`Left indicator: "${keyword}"`);
    }
  });
  
  // Count right-leaning keywords
  rightKeywords.forEach(keyword => {
    if (lowercaseContent.includes(keyword)) {
      rightScore++;
      indicators.push(`Right indicator: "${keyword}"`);
    }
  });
  
  // Detect political topics
  politicalTopics.forEach(topic => {
    if (lowercaseContent.includes(topic)) {
      detectedTopics.push(topic);
    }
  });
  
  // Determine bias direction and intensity
  let biasDirection: "left" | "right" | "center" | "none" = "none";
  let biasIntensity = 0;
  let confidence = 0.6;
  let explanation = "Keyword-based analysis used as fallback. ";
  
  if (leftScore > rightScore && leftScore > 0) {
    biasDirection = "left";
    biasIntensity = Math.min(0.8, leftScore * 0.2);
    explanation += `Detected ${leftScore} left-leaning indicators.`;
  } else if (rightScore > leftScore && rightScore > 0) {
    biasDirection = "right";
    biasIntensity = Math.min(0.8, rightScore * 0.2);
    explanation += `Detected ${rightScore} right-leaning indicators.`;
  } else if (leftScore === rightScore && leftScore > 0) {
    biasDirection = "center";
    biasIntensity = 0.3;
    explanation += "Detected balanced political indicators.";
  } else if (detectedTopics.length > 0) {
    biasDirection = "center";
    biasIntensity = 0.1;
    explanation += "Political topics detected but no clear bias direction.";
    confidence = 0.4;
  } else {
    explanation += "No significant political bias indicators detected.";
    confidence = 0.7;
  }
  
  return {
    biasDirection,
    biasIntensity,
    confidence,
    explanation,
    biasIndicators: indicators.slice(0, 5), // Limit to top 5 indicators
    politicalTopics: detectedTopics.slice(0, 3), // Limit to top 3 topics
  };
}

/**
 * Validates and normalizes bias direction value
 */
function validateBiasDirection(value: unknown): "left" | "right" | "center" | "none" {
  const validDirections = ["left", "right", "center", "none"];
  if (typeof value === "string" && validDirections.includes(value)) {
    return value as "left" | "right" | "center" | "none";
  }
  return "none";
}

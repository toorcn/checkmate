/**
 * Utility functions for sentiment analysis interpretation and context
 */

export interface SentimentContext {
  contentType?: "news" | "political" | "health" | "entertainment" | "general";
  verdict?: string;
}

/**
 * Get expected sentiment baseline for different content types
 */
export function getSentimentBaseline(contentType: string): {
  expectedNegative: number;
  expectedPositive: number;
  expectedNeutral: number;
  description: string;
} {
  switch (contentType.toLowerCase()) {
    case "political":
      return {
        expectedNegative: 0.4,
        expectedPositive: 0.2,
        expectedNeutral: 0.4,
        description: "Political content typically has more negative sentiment",
      };
    case "news":
      return {
        expectedNegative: 0.3,
        expectedPositive: 0.2,
        expectedNeutral: 0.5,
        description: "News articles should be primarily neutral and factual",
      };
    case "health":
      return {
        expectedNegative: 0.2,
        expectedPositive: 0.3,
        expectedNeutral: 0.5,
        description: "Health content should be neutral and informative",
      };
    case "entertainment":
      return {
        expectedNegative: 0.1,
        expectedPositive: 0.5,
        expectedNeutral: 0.4,
        description: "Entertainment content naturally leans positive",
      };
    default:
      return {
        expectedNegative: 0.25,
        expectedPositive: 0.25,
        expectedNeutral: 0.5,
        description: "General content should be balanced",
      };
  }
}

/**
 * Calculate how much the sentiment deviates from expected baseline
 */
export function calculateSentimentDeviation(
  scores: { positive: number; negative: number; neutral: number },
  contentType: string
): {
  deviation: number;
  interpretation: string;
  isAnomalous: boolean;
} {
  const baseline = getSentimentBaseline(contentType);
  
  const deviation = Math.abs(scores.negative - baseline.expectedNegative) +
                    Math.abs(scores.positive - baseline.expectedPositive) +
                    Math.abs(scores.neutral - baseline.expectedNeutral);
  
  const isAnomalous = deviation > 0.5;
  
  let interpretation = "";
  if (scores.negative > baseline.expectedNegative + 0.3) {
    interpretation = "Unusually negative compared to typical content in this category";
  } else if (scores.positive > baseline.expectedPositive + 0.3) {
    interpretation = "Unusually positive compared to typical content in this category";
  } else if (deviation < 0.2) {
    interpretation = "Sentiment is typical for this content type";
  } else {
    interpretation = "Sentiment deviates somewhat from typical patterns";
  }
  
  return { deviation, interpretation, isAnomalous };
}

/**
 * Get correlation between sentiment and verdict accuracy
 */
export function getSentimentVerdictCorrelation(
  emotionalIntensity: number,
  verdict: string
): {
  correlationStrength: "high" | "moderate" | "low";
  explanation: string;
  likelyAccurate: boolean;
} {
  const verdictLower = verdict.toLowerCase();
  
  // False/misleading content tends to have higher emotional intensity
  if (["false", "misleading", "conspiracy", "debunked"].includes(verdictLower)) {
    if (emotionalIntensity > 0.7) {
      return {
        correlationStrength: "high",
        explanation: "High emotional intensity aligns with false/misleading content patterns",
        likelyAccurate: true,
      };
    } else {
      return {
        correlationStrength: "moderate",
        explanation: "Lower emotional intensity than typically seen in false content",
        likelyAccurate: true,
      };
    }
  }
  
  // Verified content tends to have lower emotional intensity
  if (["verified", "true"].includes(verdictLower)) {
    if (emotionalIntensity < 0.5) {
      return {
        correlationStrength: "high",
        explanation: "Low emotional intensity aligns with verified, fact-based content",
        likelyAccurate: true,
      };
    } else {
      return {
        correlationStrength: "low",
        explanation: "Higher emotional intensity than typical for verified content - may indicate opinion or bias",
        likelyAccurate: false,
      };
    }
  }
  
  return {
    correlationStrength: "moderate",
    explanation: "Sentiment patterns are consistent with this verdict",
    likelyAccurate: true,
  };
}

/**
 * Generate actionable user guidance based on sentiment analysis
 */
export function generateSentimentGuidance(
  emotionalIntensity: number,
  flags: string[],
  manipulationTactics?: Array<{ tactic: string }>,
  verdict?: string
): string[] {
  const guidance: string[] = [];
  
  if (emotionalIntensity > 0.8) {
    guidance.push(
      "⚠️ This content is highly emotional. Take a step back before sharing or reacting."
    );
    guidance.push(
      "🔍 Ask yourself: Is this designed to make me feel something rather than inform me?"
    );
  }
  
  if (flags.includes("high_negative_sentiment")) {
    guidance.push(
      "😰 Be skeptical of content that makes you feel fear or anger - these emotions can bypass critical thinking."
    );
  }
  
  if (flags.includes("inflammatory_language")) {
    guidance.push(
      "🚩 This uses inflammatory language often found in false claims. Look for neutral, fact-based sources."
    );
  }
  
  if (flags.includes("emotionally_manipulative")) {
    guidance.push(
      "🎭 Mixed emotional appeals may be trying to confuse you. Seek clearer, more straightforward sources."
    );
  }
  
  if (flags.includes("suspiciously_positive")) {
    guidance.push(
      "✨ If it sounds too good to be true, it probably is. Verify extraordinary claims with reliable sources."
    );
  }
  
  if (manipulationTactics && manipulationTactics.length > 0) {
    guidance.push(
      `🧠 ${manipulationTactics.length} manipulation tactic${manipulationTactics.length > 1 ? 's' : ''} detected. This content may be designed to manipulate rather than inform.`
    );
  }
  
  if (verdict && ["false", "misleading", "conspiracy"].includes(verdict.toLowerCase())) {
    guidance.push(
      "✅ The emotional tactics match patterns commonly seen in false information."
    );
  }
  
  // Always include a general reminder
  if (guidance.length === 0) {
    guidance.push(
      "💡 Even neutral content should be verified. Check sources and look for evidence."
    );
  }
  
  return guidance;
}

/**
 * Format emotion name for display
 */
export function formatEmotionName(emotion: string): {
  name: string;
  emoji: string;
  color: string;
} {
  const emotions: Record<string, { name: string; emoji: string; color: string }> = {
    fear: { name: "Fear", emoji: "😰", color: "text-red-600" },
    anger: { name: "Anger", emoji: "😠", color: "text-red-700" },
    outrage: { name: "Outrage", emoji: "😡", color: "text-red-800" },
    shock: { name: "Shock", emoji: "😱", color: "text-orange-600" },
    confusion: { name: "Confusion", emoji: "😕", color: "text-yellow-600" },
    urgency: { name: "Urgency", emoji: "⏰", color: "text-orange-700" },
    anxiety: { name: "Anxiety", emoji: "😰", color: "text-yellow-700" },
    hope: { name: "Hope", emoji: "🤞", color: "text-green-600" },
    excitement: { name: "Excitement", emoji: "🤩", color: "text-blue-600" },
  };
  
  return emotions[emotion.toLowerCase()] || {
    name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    emoji: "❓",
    color: "text-gray-600",
  };
}

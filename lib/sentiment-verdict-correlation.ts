/**
 * Sentiment-Verdict Correlation Analysis
 * 
 * This module analyzes whether the sentiment patterns of content match
 * the expected patterns for its fact-check verdict, providing an additional
 * layer of validation and helping users understand content authenticity.
 */

interface SentimentScores {
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

interface VerdictPattern {
  emotionalIntensity: { min: number; max: number };
  dominantSentiment?: string[];
  sentimentScores?: {
    negative?: { min?: number; max?: number };
    positive?: { min?: number; max?: number };
    neutral?: { min?: number; max?: number };
    mixed?: { min?: number; max?: number };
  };
  manipulationTactics?: { min?: number; max?: number };
  targetEmotions?: string[];
  redFlags?: { min?: number };
  description: string;
}

/**
 * Expected sentiment patterns for each verdict type
 * Based on analysis of misinformation patterns and credible content
 */
const VERDICT_PATTERNS: Record<string, VerdictPattern> = {
  false: {
    emotionalIntensity: { min: 0.65, max: 1.0 },
    dominantSentiment: ["NEGATIVE", "MIXED"],
    sentimentScores: {
      negative: { min: 0.5 },
    },
    manipulationTactics: { min: 2 },
    targetEmotions: ["fear", "anger", "outrage"],
    redFlags: { min: 2 },
    description: "False claims typically use high emotional intensity, negative sentiment, and fear-based manipulation to spread",
  },
  misleading: {
    emotionalIntensity: { min: 0.5, max: 0.85 },
    dominantSentiment: ["MIXED", "NEGATIVE"],
    sentimentScores: {
      mixed: { min: 0.3 },
    },
    manipulationTactics: { min: 1 },
    targetEmotions: ["confusion", "urgency", "fear"],
    description: "Misleading content often uses moderate emotion with mixed sentiment to selectively frame information",
  },
  conspiracy: {
    emotionalIntensity: { min: 0.7, max: 1.0 },
    dominantSentiment: ["NEGATIVE"],
    sentimentScores: {
      negative: { min: 0.6 },
    },
    manipulationTactics: { min: 3 },
    targetEmotions: ["fear", "anger", "outrage"],
    redFlags: { min: 3 },
    description: "Conspiracy theories use very high negative sentiment and tribal language to reinforce distrust",
  },
  debunked: {
    emotionalIntensity: { min: 0.6, max: 1.0 },
    dominantSentiment: ["NEGATIVE", "POSITIVE"],
    manipulationTactics: { min: 2 },
    description: "Debunked claims often started with high emotion before being disproven",
  },
  verified: {
    emotionalIntensity: { min: 0.0, max: 0.5 },
    dominantSentiment: ["NEUTRAL"],
    sentimentScores: {
      neutral: { min: 0.45 },
    },
    manipulationTactics: { max: 1 },
    targetEmotions: [],
    redFlags: { min: 0 },
    description: "Verified content is typically neutral, fact-based, and uses minimal emotional language",
  },
  true: {
    emotionalIntensity: { min: 0.0, max: 0.5 },
    dominantSentiment: ["NEUTRAL"],
    sentimentScores: {
      neutral: { min: 0.4 },
    },
    manipulationTactics: { max: 1 },
    description: "True information tends to be presented neutrally with factual language",
  },
  unverified: {
    emotionalIntensity: { min: 0.0, max: 0.7 },
    dominantSentiment: ["NEUTRAL", "MIXED"],
    description: "Unverified content can vary widely in emotional tone",
  },
  satire: {
    emotionalIntensity: { min: 0.5, max: 1.0 },
    dominantSentiment: ["POSITIVE", "MIXED"],
    sentimentScores: {
      positive: { min: 0.3 },
    },
    description: "Satire often uses exaggerated positive or mixed sentiment with obvious amplifiers",
  },
  opinion: {
    emotionalIntensity: { min: 0.3, max: 0.8 },
    dominantSentiment: ["POSITIVE", "NEGATIVE", "MIXED"],
    description: "Opinion pieces can have varied emotional tone depending on perspective",
  },
  exaggerated: {
    emotionalIntensity: { min: 0.6, max: 1.0 },
    dominantSentiment: ["POSITIVE", "NEGATIVE"],
    manipulationTactics: { min: 1 },
    redFlags: { min: 1 },
    description: "Exaggerated claims use amplified emotion beyond what facts support",
  },
  outdated: {
    emotionalIntensity: { min: 0.0, max: 0.6 },
    description: "Outdated information may have been accurate, so emotion varies",
  },
  partially_true: {
    emotionalIntensity: { min: 0.2, max: 0.7 },
    dominantSentiment: ["MIXED", "NEUTRAL"],
    sentimentScores: {
      mixed: { min: 0.2 },
    },
    description: "Partially true content often mixes factual and emotional elements",
  },
  rumor: {
    emotionalIntensity: { min: 0.4, max: 0.8 },
    dominantSentiment: ["MIXED", "NEGATIVE"],
    targetEmotions: ["curiosity", "urgency"],
    description: "Rumors often use moderate emotion to spread quickly without verification",
  },
};

export interface PatternMatchResult {
  confidence: number; // 0-100
  matches: string[];
  mismatches: string[];
  overallAssessment: "strong_match" | "partial_match" | "weak_match" | "mismatch";
  explanation: string;
  userMessage: string;
}

/**
 * Calculate how well sentiment patterns match the expected pattern for a verdict
 */
export function calculateSentimentVerdictCorrelation(
  sentiment: {
    overall: string;
    scores: SentimentScores;
    emotionalIntensity: number;
    manipulationTactics?: Array<{ tactic: string }>;
    targetEmotions?: string[];
    linguisticRedFlags?: Array<{ type: string }>;
  },
  verdict: string
): PatternMatchResult {
  // Normalize verdict - handle various forms
  let normalizedVerdict = verdict.toLowerCase().trim();
  
  // Map common variations to canonical forms
  const verdictMap: Record<string, string> = {
    'true': 'verified',
    'unverifiable': 'unverified',
  };
  
  if (verdictMap[normalizedVerdict]) {
    normalizedVerdict = verdictMap[normalizedVerdict];
  }
  
  const pattern = VERDICT_PATTERNS[normalizedVerdict];

  // Default result for unknown verdicts
  if (!pattern) {
    return {
      confidence: 50,
      matches: [],
      mismatches: [],
      overallAssessment: "partial_match",
      explanation: `No established pattern for verdict: "${verdict}" (normalized: "${normalizedVerdict}")`,
      userMessage: `Pattern analysis not available for "${verdict}" verdict type.`,
    };
  }

  const matches: string[] = [];
  const mismatches: string[] = [];
  let matchScore = 0;
  let totalChecks = 0;

  // Check 1: Emotional Intensity (weighted scoring based on how close to range)
  totalChecks++;
  const intensityInRange =
    sentiment.emotionalIntensity >= pattern.emotionalIntensity.min &&
    sentiment.emotionalIntensity <= pattern.emotionalIntensity.max;

  if (intensityInRange) {
    matchScore++;
    matches.push(
      `Emotional intensity (${(sentiment.emotionalIntensity * 100).toFixed(0)}%) matches expected range for ${normalizedVerdict} content`
    );
  } else {
    // Partial credit based on how close to the range
    const rangeSize = pattern.emotionalIntensity.max - pattern.emotionalIntensity.min;
    let distance = 0;
    
    if (sentiment.emotionalIntensity < pattern.emotionalIntensity.min) {
      distance = pattern.emotionalIntensity.min - sentiment.emotionalIntensity;
    } else {
      distance = sentiment.emotionalIntensity - pattern.emotionalIntensity.max;
    }
    
    // Give partial credit if within 20% of the range
    const tolerance = 0.2;
    if (distance <= tolerance) {
      const partialCredit = 1 - (distance / tolerance);
      matchScore += partialCredit;
      matches.push(
        `Emotional intensity (${(sentiment.emotionalIntensity * 100).toFixed(0)}%) is close to expected range for ${normalizedVerdict} content`
      );
    } else {
      const expected = `${(pattern.emotionalIntensity.min * 100).toFixed(0)}-${(pattern.emotionalIntensity.max * 100).toFixed(0)}%`;
      const actual = `${(sentiment.emotionalIntensity * 100).toFixed(0)}%`;
      mismatches.push(
        `Emotional intensity (${actual}) outside expected range (${expected}) for ${normalizedVerdict} content`
      );
    }
  }

  // Check 2: Dominant Sentiment Type
  if (pattern.dominantSentiment && pattern.dominantSentiment.length > 0) {
    totalChecks++;
    const overallUpper = sentiment.overall.toUpperCase();
    
    if (pattern.dominantSentiment.includes(overallUpper)) {
      matchScore++;
      matches.push(
        `${sentiment.overall} sentiment aligns with expected patterns for ${normalizedVerdict} content`
      );
    } else {
      mismatches.push(
        `${sentiment.overall} sentiment unexpected (expected: ${pattern.dominantSentiment.join(" or ")})`
      );
    }
  }

  // Check 3: Sentiment Score Ranges (with partial credit for close matches)
  if (pattern.sentimentScores) {
    const tolerance = 0.15; // 15% tolerance for partial credit
    
    // Check negative score
    if (pattern.sentimentScores.negative) {
      totalChecks++;
      const { min, max } = pattern.sentimentScores.negative;
      const negScore = sentiment.scores.negative;
      
      if (
        (min === undefined || negScore >= min) &&
        (max === undefined || negScore <= max)
      ) {
        matchScore++;
        matches.push(
          `Negative sentiment (${(negScore * 100).toFixed(0)}%) matches expected pattern`
        );
      } else {
        // Calculate distance from range
        let distance = 0;
        if (min !== undefined && negScore < min) {
          distance = min - negScore;
        } else if (max !== undefined && negScore > max) {
          distance = negScore - max;
        }
        
        // Give partial credit if close
        if (distance <= tolerance) {
          const partialCredit = 1 - (distance / tolerance);
          matchScore += partialCredit;
          matches.push(
            `Negative sentiment (${(negScore * 100).toFixed(0)}%) is close to expected range`
          );
        } else {
          mismatches.push(
            `Negative sentiment (${(negScore * 100).toFixed(0)}%) outside expected range`
          );
        }
      }
    }

    // Check positive score
    if (pattern.sentimentScores.positive) {
      totalChecks++;
      const { min, max } = pattern.sentimentScores.positive;
      const posScore = sentiment.scores.positive;
      
      if (
        (min === undefined || posScore >= min) &&
        (max === undefined || posScore <= max)
      ) {
        matchScore++;
        matches.push(
          `Positive sentiment (${(posScore * 100).toFixed(0)}%) matches expected pattern`
        );
      } else {
        // Calculate distance from range
        let distance = 0;
        if (min !== undefined && posScore < min) {
          distance = min - posScore;
        } else if (max !== undefined && posScore > max) {
          distance = posScore - max;
        }
        
        // Give partial credit if close
        if (distance <= tolerance) {
          const partialCredit = 1 - (distance / tolerance);
          matchScore += partialCredit;
          matches.push(
            `Positive sentiment (${(posScore * 100).toFixed(0)}%) is close to expected range`
          );
        } else {
          mismatches.push(
            `Positive sentiment (${(posScore * 100).toFixed(0)}%) outside expected range`
          );
        }
      }
    }

    // Check neutral score
    if (pattern.sentimentScores.neutral) {
      totalChecks++;
      const { min, max } = pattern.sentimentScores.neutral;
      const neutScore = sentiment.scores.neutral;
      
      if (
        (min === undefined || neutScore >= min) &&
        (max === undefined || neutScore <= max)
      ) {
        matchScore++;
        matches.push(
          `Neutral sentiment (${(neutScore * 100).toFixed(0)}%) matches expected pattern`
        );
      } else {
        // Calculate distance from range
        let distance = 0;
        if (min !== undefined && neutScore < min) {
          distance = min - neutScore;
        } else if (max !== undefined && neutScore > max) {
          distance = neutScore - max;
        }
        
        // Give partial credit if close
        if (distance <= tolerance) {
          const partialCredit = 1 - (distance / tolerance);
          matchScore += partialCredit;
          matches.push(
            `Neutral sentiment (${(neutScore * 100).toFixed(0)}%) is close to expected range`
          );
        } else {
          mismatches.push(
            `Neutral sentiment (${(neutScore * 100).toFixed(0)}%) outside expected range`
          );
        }
      }
    }
  }

  // Check 4: Manipulation Tactics (with partial credit)
  if (pattern.manipulationTactics) {
    totalChecks++;
    const tacticsCount = sentiment.manipulationTactics?.length || 0;
    const { min, max } = pattern.manipulationTactics;
    
    if (
      (min === undefined || tacticsCount >= min) &&
      (max === undefined || tacticsCount <= max)
    ) {
      matchScore++;
      matches.push(
        `Manipulation tactics (${tacticsCount}) align with ${normalizedVerdict} content patterns`
      );
    } else {
      // Calculate how close to the range
      let distance = 0;
      if (min !== undefined && tacticsCount < min) {
        distance = min - tacticsCount;
      } else if (max !== undefined && tacticsCount > max) {
        distance = tacticsCount - max;
      }
      
      // Give partial credit if within 1-2 tactics of expected
      const tolerance = 2;
      if (distance <= tolerance) {
        const partialCredit = 1 - (distance / tolerance);
        matchScore += partialCredit;
        matches.push(
          `Manipulation tactics (${tacticsCount}) are close to ${normalizedVerdict} content patterns`
        );
      } else {
        const expected =
          min !== undefined && max !== undefined
            ? `${min}-${max}`
            : min !== undefined
            ? `${min}+`
            : `≤${max}`;
        mismatches.push(
          `Manipulation tactics (${tacticsCount}) outside expected range (${expected})`
        );
      }
    }
  }

  // Check 5: Target Emotions
  if (pattern.targetEmotions && pattern.targetEmotions.length > 0 && sentiment.targetEmotions) {
    totalChecks++;
    const hasExpectedEmotions = pattern.targetEmotions.some((expected) =>
      sentiment.targetEmotions?.some((actual) =>
        actual.toLowerCase().includes(expected.toLowerCase())
      )
    );
    
    if (hasExpectedEmotions) {
      matchScore++;
      const matchedEmotions = pattern.targetEmotions.filter((expected) =>
        sentiment.targetEmotions?.some((actual) =>
          actual.toLowerCase().includes(expected.toLowerCase())
        )
      );
      matches.push(
        `Targets expected emotions for ${normalizedVerdict} content (${matchedEmotions.join(", ")})`
      );
    } else if (sentiment.targetEmotions.length === 0) {
      // Expected emotions but none found
      matchScore += 0.5; // Partial credit if no emotions targeted
    } else {
      mismatches.push(
        `Targets unexpected emotions (expected: ${pattern.targetEmotions.join(", ")})`
      );
    }
  }

  // Check 6: Linguistic Red Flags
  if (pattern.redFlags) {
    totalChecks++;
    const redFlagsCount = sentiment.linguisticRedFlags?.length || 0;
    const { min } = pattern.redFlags;
    
    if (min === undefined || redFlagsCount >= min) {
      matchScore++;
      matches.push(
        `Linguistic red flags (${redFlagsCount}) consistent with ${normalizedVerdict} content`
      );
    } else {
      mismatches.push(
        `Fewer linguistic red flags (${redFlagsCount}) than typical for ${normalizedVerdict} content (expected: ${min}+)`
      );
    }
  }

  // Calculate confidence percentage
  const confidence = Math.round((matchScore / totalChecks) * 100);

  // Determine overall assessment
  let overallAssessment: PatternMatchResult["overallAssessment"];
  let explanation: string;
  let userMessage: string;

  if (confidence >= 80) {
    overallAssessment = "strong_match";
    explanation = `The sentiment patterns strongly match what we typically see in ${normalizedVerdict} content. ${pattern.description}`;
    userMessage = `✅ Strong Pattern Match: This sentiment signature is highly consistent with ${normalizedVerdict} content, increasing confidence in the verdict.`;
  } else if (confidence >= 60) {
    overallAssessment = "partial_match";
    explanation = `The sentiment patterns partially match ${normalizedVerdict} content. Some characteristics align while others differ.`;
    userMessage = `⚠️ Partial Match: Some sentiment patterns align with ${normalizedVerdict} content, but there are notable differences worth considering.`;
  } else if (confidence >= 40) {
    overallAssessment = "weak_match";
    explanation = `The sentiment patterns show weak correlation with typical ${normalizedVerdict} content.`;
    userMessage = `⚠️ Weak Match: The emotional signature differs from typical ${normalizedVerdict} content. This may warrant additional scrutiny.`;
  } else {
    overallAssessment = "mismatch";
    explanation = `The sentiment patterns do not match what we typically see in ${normalizedVerdict} content. This inconsistency is noteworthy.`;
    userMessage = `🚨 Pattern Mismatch: The emotional signature is inconsistent with ${normalizedVerdict} content. The verdict may need reconsideration or the content is an outlier.`;
  }

  return {
    confidence,
    matches,
    mismatches,
    overallAssessment,
    explanation,
    userMessage,
  };
}

/**
 * Get a simple consistency badge for quick display
 */
export function getConsistencyBadge(
  sentiment: { emotionalIntensity: number },
  verdict: string
): { text: string; variant: "success" | "warning" | "danger"; icon: string } {
  const normalizedVerdict = verdict.toLowerCase().trim();
  const pattern = VERDICT_PATTERNS[normalizedVerdict];

  if (!pattern) {
    return { text: "Pattern Unknown", variant: "warning", icon: "❓" };
  }

  const intensityInRange =
    sentiment.emotionalIntensity >= pattern.emotionalIntensity.min &&
    sentiment.emotionalIntensity <= pattern.emotionalIntensity.max;

  if (intensityInRange) {
    return {
      text: `Matches ${normalizedVerdict} pattern`,
      variant: "success",
      icon: "✓",
    };
  } else {
    return {
      text: `Unusual for ${normalizedVerdict} content`,
      variant: "warning",
      icon: "⚠️",
    };
  }
}

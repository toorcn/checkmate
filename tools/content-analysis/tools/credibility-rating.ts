import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for calculating a content creator's credibility rating (0-10) based on analysis results.
 */
export const calculateCreatorCredibilityRating = tool({
  description:
    "Calculate a content creator's credibility rating (0-10) based on fact-check results, content quality, and other factors",
  parameters: z.object({
    factCheckResult: z
      .object({
        verdict: z.string().optional(), // "true", "false", "misleading", "unverifiable"
        confidence: z.number().optional(), // 0-100
        isVerified: z.boolean().optional(),
        sources: z.array(z.object({
          url: z.string(),
          title: z.string(),
          relevance: z.number(), // 0-1 scale
        })).optional(),
      })
      .optional(),
    contentMetadata: z.object({
      creator: z.string(),
      platform: z.string(),
      title: z.string().optional(),
      hasTranscription: z.boolean(),
      contentType: z.string().optional(),
    }),
    analysisMetrics: z
      .object({
        hasNewsContent: z.boolean().optional(),
        needsFactCheck: z.boolean().optional(),
        contentLength: z.number().optional(), // Length of transcription/content
        sentimentAnalysis: z.object({
          overall: z.string().optional(), // POSITIVE, NEGATIVE, NEUTRAL, MIXED
          emotionalIntensity: z.number().optional(), // 0-1 scale
          flags: z.array(z.string()).optional(), // Warning flags
        }).optional(),
        creatorHistoricalCredibility: z.number().optional(), // Previous credibility rating
        totalAnalyses: z.number().optional(), // Number of previous analyses
      })
      .optional(),
  }),
  execute: async ({ factCheckResult, contentMetadata, analysisMetrics }) => {
    try {
      // Define weighting multipliers for different factor categories
      const WEIGHTS = {
        factCheck: 0.6,        // Fact-check results dominate (60%)
        creatorHistory: 0.2,   // Creator history matters (20%)
        contentQuality: 0.15,  // Content quality factors (15%)
        sentiment: 0.05,       // Sentiment analysis (5%)
      };

      // Start with baseline and track scores by category
      const baselineScore = 6.0;
      let factCheckScore = 0;
      let historyScore = 0;
      let qualityScore = 0;
      let sentimentScore = 0;
      const factors = [];

      // Factor 1: Source-weighted credibility system (NEW APPROACH)
      if (factCheckResult && factCheckResult.sources && factCheckResult.sources.length > 0) {
        const { sources, verdict, confidence } = factCheckResult;
        const totalSources = sources.length;
        
        // Validate sources have required properties
        const validSources = sources.filter(source => 
          source.url && source.title && typeof source.relevance === 'number'
        );
        
        if (validSources.length === 0) {
          // Fall back to verdict-based scoring if no valid sources
          console.warn("No valid sources found, falling back to verdict-based scoring");
        } else {
          // Use valid sources for calculation
          const sourcesToUse = validSources;
        
        // Calculate how many sources support the claim
        let supportingSources = 0;
        let opposingSources = 0;
        let neutralSources = 0;
        
          // Analyze each source's relevance and stance
          sourcesToUse.forEach(source => {
            const sourceRelevance = source.relevance; // 0-1 scale
            
            // For unverifiable content, we need to determine if sources actually support the claim
            // Since this is "unverifiable", we'll treat high relevance as potential support
            // and low relevance as lack of support
            if (sourceRelevance >= 0.6) {
              supportingSources++; // High relevance sources likely support the claim
            } else if (sourceRelevance <= 0.4) {
              opposingSources++; // Low relevance sources don't support the claim
            } else {
              neutralSources++; // Medium relevance sources are neutral
            }
          });
        
          // Calculate source support ratio
          const supportRatio = supportingSources / sourcesToUse.length;
          const opposeRatio = opposingSources / sourcesToUse.length;
        
          // Apply source-weighted penalty/bonus (clamped to -5 to +5 range)
          if (opposeRatio > 0.7) {
            // Most sources oppose the claim
            factCheckScore = -Math.min(5, opposeRatio * 5.0); // Up to -5 penalty
            factors.push(`Most sources oppose claim (${opposingSources}/${sourcesToUse.length}) (${factCheckScore.toFixed(1)})`);
          } else if (supportRatio > 0.7) {
            // Most sources support the claim
            factCheckScore = Math.min(5, supportRatio * 4.0); // Up to +5 bonus
            factors.push(`Most sources support claim (${supportingSources}/${sourcesToUse.length}) (+${factCheckScore.toFixed(1)})`);
          } else {
            // Mixed sources - apply smaller penalty
            factCheckScore = -Math.min(5, opposeRatio * 2.5); // Up to -5 penalty
            factors.push(`Mixed source support (${supportingSources} support, ${opposingSources} oppose) (${factCheckScore.toFixed(1)})`);
          }
        
          // Confidence-based modifier (keep within 50-70% range as requested)
          if (confidence && confidence > 0) {
            // Handle both 0-1 and 0-100 scales
            const confidenceValue = confidence > 1 ? confidence : confidence * 100;
            // Normalize confidence to 50-70% range for user cross-checking
            const normalizedConfidence = Math.max(50, Math.min(70, confidenceValue));
            const confidenceModifier = ((normalizedConfidence - 60) / 100) * 1.0; // -0.1 to +0.1
            factCheckScore += confidenceModifier;
            factors.push(`Confidence modifier (${normalizedConfidence}%): ${confidenceModifier.toFixed(2)}`);
          }
        }
        
      } else if (factCheckResult && factCheckResult.verdict) {
        // Fallback to verdict-based scoring if no sources available
        const { verdict, confidence } = factCheckResult;
        
        switch (verdict.toLowerCase()) {
          case "true":
          case "verified":
            factCheckScore = 3.0; // Strong bonus for verified content
            factors.push("Content verified as true (+3.0)");
            break;
          case "partially_true":
            factCheckScore = 1.0;
            factors.push("Content partially true (+1.0)");
            break;
          case "false":
          case "conspiracy":
          case "debunked":
            factCheckScore = -4.0; // Strong penalty for false content
            factors.push("Content flagged as false/conspiracy/debunked (-4.0)");
            break;
          case "misleading":
          case "exaggerated":
            factCheckScore = -3.0;
            factors.push("Content flagged as misleading/exaggerated (-3.0)");
            break;
          case "unverifiable":
            factCheckScore = -1.5; // Penalty for unverifiable content
            factors.push("Content unverifiable (-1.5)");
            break;
          case "opinion":
            factCheckScore = 0.5;
            factors.push("Content identified as opinion (+0.5)");
            break;
          case "satire":
            factCheckScore = 1.0;
            factors.push("Content identified as satire (+1.0)");
            break;
        }
      }

      // Factor 1.5: Accumulative Creator History (with diminishing returns)
      if (analysisMetrics?.creatorHistoricalCredibility && analysisMetrics?.totalAnalyses) {
        const historicalCred = analysisMetrics.creatorHistoricalCredibility;
        const totalAnalyses = analysisMetrics.totalAnalyses;
        
        // Clamp history score to -3 to +3 range
        if (historicalCred < 4.0 && totalAnalyses > 1) {
          // Penalty for poor history (diminishing returns)
          const diminishingFactor = Math.max(0.3, 1 - (totalAnalyses / 20)); // Diminishes after 20 analyses
          historyScore = -Math.min(3, (4.0 - historicalCred) * 0.5 * diminishingFactor);
          factors.push(`Creator history penalty (avg: ${historicalCred.toFixed(1)}/10) (${historyScore.toFixed(1)})`);
        } else if (historicalCred > 7.0 && totalAnalyses > 1) {
          // Bonus for good history (diminishing returns)
          const diminishingFactor = Math.max(0.3, 1 - (totalAnalyses / 20)); // Diminishes after 20 analyses
          historyScore = Math.min(3, (historicalCred - 7.0) * 0.3 * diminishingFactor);
          factors.push(`Creator history bonus (avg: ${historicalCred.toFixed(1)}/10) (+${historyScore.toFixed(1)})`);
        }
      }

      // Factor 2: Content quality indicators (clamped to -3 to +3 range)
      if (contentMetadata.hasTranscription) {
        qualityScore += 1.0;
        factors.push("Has transcription/clear content (+1.0)");
      }

      // Factor 3: News content handling
      if (analysisMetrics?.hasNewsContent) {
        if (analysisMetrics.needsFactCheck && factCheckResult?.isVerified) {
          qualityScore += 2.0;
          factors.push("News content properly fact-checked (+2.0)");
        } else if (analysisMetrics.needsFactCheck && !factCheckResult?.isVerified) {
          qualityScore -= 1.5;
          factors.push("News content not properly verified (-1.5)");
        }
      }

      // Factor 4: Content length/substance
      if (analysisMetrics?.contentLength) {
        if (analysisMetrics.contentLength > 200) {
          qualityScore += 1.0;
          factors.push("Substantial content length (+1.0)");
        } else if (analysisMetrics.contentLength > 100) {
          qualityScore += 0.5;
          factors.push("Good content length (+0.5)");
        } else if (analysisMetrics.contentLength < 20) {
          qualityScore -= 1.0;
          factors.push("Very short content (-1.0)");
        } else if (analysisMetrics.contentLength < 50) {
          qualityScore -= 0.3;
          factors.push("Short content (-0.3)");
        }
      }

      // Factor 5: Platform-specific modifiers
      switch (contentMetadata.platform.toLowerCase()) {
        case "twitter":
        case "x":
          qualityScore -= 0.5;
          factors.push("Twitter platform modifier (-0.5)");
          break;
        case "tiktok":
          qualityScore += 0.3;
          factors.push("TikTok platform modifier (+0.3)");
          break;
        case "youtube":
          qualityScore += 0.8;
          factors.push("YouTube platform modifier (+0.8)");
          break;
        case "instagram":
          qualityScore += 0.2;
          factors.push("Instagram platform modifier (+0.2)");
          break;
      }

      // Factor 6: Content type modifiers
      if (contentMetadata.contentType) {
        switch (contentMetadata.contentType.toLowerCase()) {
          case "educational":
          case "tutorial":
            qualityScore += 1.2;
            factors.push("Educational content (+1.2)");
            break;
          case "news":
          case "journalism":
            qualityScore += 1.0;
            factors.push("News/journalism content (+1.0)");
            break;
          case "entertainment":
          case "comedy":
            qualityScore += 0.3;
            factors.push("Entertainment content (+0.3)");
            break;
          case "opinion":
            qualityScore -= 0.3;
            factors.push("Opinion content (-0.3)");
            break;
        }
      }

      // Clamp quality score to -3 to +3 range
      qualityScore = Math.max(-3, Math.min(3, qualityScore));

      // Factor 7: Sentiment analysis modifiers (clamped to -3 to +3 range)
      if (analysisMetrics?.sentimentAnalysis) {
        const { overall, emotionalIntensity, flags } = analysisMetrics.sentimentAnalysis;
        
        // Emotional intensity modifier
        if (emotionalIntensity !== undefined) {
          if (emotionalIntensity > 0.8) {
            sentimentScore -= 1.0;
            factors.push("High emotional intensity (-1.0)");
          } else if (emotionalIntensity > 0.6) {
            sentimentScore -= 0.5;
            factors.push("Moderate emotional intensity (-0.5)");
          } else if (emotionalIntensity < 0.3) {
            sentimentScore += 0.5;
            factors.push("Low emotional intensity (factual) (+0.5)");
          }
        }

        // Sentiment flags modifiers
        if (flags && flags.length > 0) {
          if (flags.includes("inflammatory_language")) {
            sentimentScore -= 1.0;
            factors.push("Inflammatory language (-1.0)");
          }
          if (flags.includes("emotionally_manipulative")) {
            sentimentScore -= 1.2;
            factors.push("Emotionally manipulative content (-1.2)");
          }
          if (flags.includes("suspiciously_positive")) {
            sentimentScore -= 0.5;
            factors.push("Suspiciously positive (potential clickbait) (-0.5)");
          }
          if (flags.includes("neutral_factual")) {
            sentimentScore += 0.8;
            factors.push("Neutral, factual tone (+0.8)");
          }
        }

        // Overall sentiment modifier
        if (overall) {
          switch (overall.toUpperCase()) {
            case "NEUTRAL":
              sentimentScore += 0.5;
              factors.push("Neutral sentiment (+0.5)");
              break;
            case "POSITIVE":
              sentimentScore += 0.2;
              factors.push("Positive sentiment (+0.2)");
              break;
            case "NEGATIVE":
              sentimentScore -= 0.4;
              factors.push("Negative sentiment (-0.4)");
              break;
            case "MIXED":
              sentimentScore -= 0.2;
              factors.push("Mixed sentiment (-0.2)");
              break;
          }
        }
      }

      // Clamp sentiment score to -3 to +3 range
      sentimentScore = Math.max(-3, Math.min(3, sentimentScore));

      // Calculate final weighted credibility score
      const credibilityScore = baselineScore + 
        (factCheckScore * WEIGHTS.factCheck) +
        (historyScore * WEIGHTS.creatorHistory) +
        (qualityScore * WEIGHTS.contentQuality) +
        (sentimentScore * WEIGHTS.sentiment);

      // Apply unverifiable cap (Option 3 from your suggestions)
      let cappedScore = credibilityScore;
      if (factCheckResult?.verdict?.toLowerCase() === "unverifiable") {
        cappedScore = Math.min(cappedScore, 6.0); // Cap unverifiable content at 6.0
        factors.push("Unverifiable content capped at 6.0/10");
      }

      // Ensure rating stays within 0-10 bounds
      const finalScore = Math.max(0, Math.min(10, cappedScore));

      return {
        success: true,
        data: {
          credibilityRating: Math.round(finalScore * 10) / 10, // Round to 1 decimal
          rawScore: finalScore,
          factors,
          explanation: `Creator credibility rating: ${finalScore.toFixed(1)}/10 based on weighted factors (Fact-check: ${(factCheckScore * WEIGHTS.factCheck).toFixed(1)}, History: ${(historyScore * WEIGHTS.creatorHistory).toFixed(1)}, Quality: ${(qualityScore * WEIGHTS.contentQuality).toFixed(1)}, Sentiment: ${(sentimentScore * WEIGHTS.sentiment).toFixed(1)})`,
          creator: contentMetadata.creator,
          platform: contentMetadata.platform,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate credibility rating",
      };
    }
  },
});

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Tag,
  Users,
  Brain,
  ShieldAlert,
  Target,
  AlertCircle,
  Info,
  CheckCircle,
  BarChart3,
  Shield,
} from "lucide-react";
import { generateSentimentGuidance, formatEmotionName } from "@/lib/sentiment-utils";
import { calculateSentimentVerdictCorrelation } from "@/lib/sentiment-verdict-correlation";

interface SentimentAnalysisData {
  overall: string;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  keyPhrases: string[];
  entities?: Array<{
    text: string;
    type: string;
  }>;
  emotionalIntensity: number;
  flags: string[];
  manipulationTactics?: Array<{
    tactic: string;
    description: string;
    examples: string[];
  }>;
  credibilityImpact?: {
    modifier: number;
    explanation: string;
  };
  targetEmotions?: string[];
  linguisticRedFlags?: Array<{
    type: string;
    phrase: string;
    reason: string;
  }>;
}

interface SentimentDisplayProps {
  sentiment: SentimentAnalysisData;
  verdict?: string;
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment.toUpperCase()) {
    case "POSITIVE":
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    case "NEGATIVE":
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    case "NEUTRAL":
      return <Minus className="h-5 w-5 text-gray-500" />;
    case "MIXED":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Minus className="h-5 w-5 text-gray-500" />;
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment.toUpperCase()) {
    case "POSITIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    case "NEGATIVE":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    case "NEUTRAL":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "MIXED":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

const getIntensityColor = (intensity: number) => {
  if (intensity >= 0.8)
    return "bg-red-500 dark:bg-red-600"; // Very high - red flag
  if (intensity >= 0.6) return "bg-orange-500 dark:bg-orange-600"; // High
  if (intensity >= 0.4) return "bg-yellow-500 dark:bg-yellow-600"; // Medium
  return "bg-green-500 dark:bg-green-600"; // Low - good
};

const getIntensityLabel = (intensity: number) => {
  if (intensity >= 0.8) return "Very High ⚠️";
  if (intensity >= 0.6) return "High";
  if (intensity >= 0.4) return "Medium";
  return "Low";
};

const getFlagBadgeColor = (flag: string) => {
  switch (flag) {
    case "high_negative_sentiment":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    case "emotionally_manipulative":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
    case "inflammatory_language":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
    case "suspiciously_positive":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

const getFlagLabel = (flag: string) => {
  const labels: Record<string, string> = {
    high_negative_sentiment: "High Negative Sentiment",
    emotionally_manipulative: "Emotionally Manipulative",
    inflammatory_language: "Inflammatory Language",
    suspiciously_positive: "Suspiciously Positive",
  };
  return labels[flag] || flag.replace(/_/g, " ");
};

const getFlagDescription = (flag: string) => {
  const descriptions: Record<string, string> = {
    high_negative_sentiment:
      "Content shows very high negative sentiment, potentially designed to provoke fear or anger.",
    emotionally_manipulative:
      "High emotional intensity with mixed sentiment often indicates manipulation tactics.",
    inflammatory_language:
      "Contains provocative keywords like 'shocking', 'scandal', or 'exposed' designed to trigger reactions.",
    suspiciously_positive:
      "Unusually high positive sentiment may indicate clickbait or 'too good to be true' content.",
  };
  return descriptions[flag] || "";
};

export function SentimentDisplay({ sentiment, verdict }: SentimentDisplayProps) {
  if (!sentiment) return null;

  const hasWarnings = sentiment.flags.length > 0 || sentiment.emotionalIntensity >= 0.7;
  const guidanceMessages = generateSentimentGuidance(
    sentiment.emotionalIntensity,
    sentiment.flags,
    sentiment.manipulationTactics,
    verdict
  );

  // Calculate pattern matching if verdict is available
  const patternMatch = verdict
    ? calculateSentimentVerdictCorrelation(
        {
          overall: sentiment.overall,
          scores: sentiment.scores,
          emotionalIntensity: sentiment.emotionalIntensity,
          manipulationTactics: sentiment.manipulationTactics,
          targetEmotions: sentiment.targetEmotions,
          linguisticRedFlags: sentiment.linguisticRedFlags,
        },
        verdict
      )
    : null;

  const getPatternMatchColor = (assessment: string) => {
    switch (assessment) {
      case "strong_match":
        return "border-green-500 bg-green-50 dark:bg-green-900/10";
      case "partial_match":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/10";
      case "weak_match":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/10";
      case "mismatch":
        return "border-red-500 bg-red-50 dark:bg-red-900/10";
      default:
        return "border-gray-300 bg-gray-50 dark:bg-gray-800";
    }
  };

  const getPatternMatchIcon = (assessment: string) => {
    switch (assessment) {
      case "strong_match":
        return <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "partial_match":
        return <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "weak_match":
        return <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case "mismatch":
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <Card className={hasWarnings ? "border-yellow-200 dark:border-yellow-800" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sentiment Analysis
          </CardTitle>
          <Badge className={getSentimentColor(sentiment.overall)}>
            <span className="flex items-center gap-1">
              {getSentimentIcon(sentiment.overall)}
              {sentiment.overall}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pattern Matching Section - First priority display */}
        {patternMatch && verdict && (
          <div
            className={`p-4 rounded-lg border-2 ${getPatternMatchColor(
              patternMatch.overallAssessment
            )}`}
          >
            <div className="flex items-start gap-3">
              {getPatternMatchIcon(patternMatch.overallAssessment)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">
                    Sentiment-Verdict Consistency Check
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-sm font-bold ${
                      patternMatch.confidence >= 80
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        : patternMatch.confidence >= 60
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                        : patternMatch.confidence >= 40
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                    }`}
                  >
                    {patternMatch.confidence}% Match
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {patternMatch.userMessage}
                </p>

                {/* Matches */}
                {patternMatch.matches.length > 0 && (
                  <div className="space-y-1 mb-2">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">
                      Pattern Matches:
                    </p>
                    <ul className="space-y-0.5">
                      {patternMatch.matches.map((match, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                          <span>{match}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mismatches */}
                {patternMatch.mismatches.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                      Inconsistencies:
                    </p>
                    <ul className="space-y-0.5">
                      {patternMatch.mismatches.map((mismatch, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-orange-600 dark:text-orange-400 mt-0.5">⚠</span>
                          <span>{mismatch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs text-muted-foreground italic">
                    {patternMatch.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actionable Guidance */}
        {guidanceMessages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold">What You Should Do</h4>
            </div>
            <div className="space-y-2">
              {guidanceMessages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
                >
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">{message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sentiment Scores */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Sentiment Breakdown</h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 dark:text-green-400">Positive</span>
                <span className="font-medium">
                  {Math.round(sentiment.scores.positive * 100)}%
                </span>
              </div>
              <Progress
                value={sentiment.scores.positive * 100}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 dark:text-red-400">Negative</span>
                <span className="font-medium">
                  {Math.round(sentiment.scores.negative * 100)}%
                </span>
              </div>
              <Progress
                value={sentiment.scores.negative * 100}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Neutral</span>
                <span className="font-medium">
                  {Math.round(sentiment.scores.neutral * 100)}%
                </span>
              </div>
              <Progress
                value={sentiment.scores.neutral * 100}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-600 dark:text-yellow-400">Mixed</span>
                <span className="font-medium">
                  {Math.round(sentiment.scores.mixed * 100)}%
                </span>
              </div>
              <Progress
                value={sentiment.scores.mixed * 100}
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Emotional Intensity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">Emotional Intensity</h4>
            <span className="text-sm font-medium">
              {getIntensityLabel(sentiment.emotionalIntensity)}
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getIntensityColor(
                sentiment.emotionalIntensity
              )}`}
              style={{ width: `${sentiment.emotionalIntensity * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {sentiment.emotionalIntensity >= 0.7
              ? "⚠️ High emotional content may indicate bias or manipulation"
              : "Content appears reasonably balanced"}
          </p>
        </div>

        {/* Warning Flags */}
        {sentiment.flags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Warning Flags ({sentiment.flags.length})
              </h4>
            </div>
            <div className="space-y-2">
              {sentiment.flags.map((flag, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-start gap-2">
                    <Badge className={getFlagBadgeColor(flag)} variant="outline">
                      {getFlagLabel(flag)}
                    </Badge>
                  </div>
                  {getFlagDescription(flag) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getFlagDescription(flag)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Phrases */}
        {sentiment.keyPhrases.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Key Phrases</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {sentiment.keyPhrases.slice(0, 10).map((phrase, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {phrase}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Entities */}
        {sentiment.entities && sentiment.entities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Detected Entities</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sentiment.entities.slice(0, 8).map((entity, index) => (
                <div
                  key={index}
                  className="p-2 rounded bg-gray-50 dark:bg-gray-800 text-xs"
                >
                  <div className="font-medium truncate">{entity.text}</div>
                  <div className="text-muted-foreground text-xs">
                    {entity.type.toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credibility Impact */}
        {sentiment.credibilityImpact && sentiment.credibilityImpact.modifier < 1.0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                Impact on Credibility
              </h4>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Credibility Modifier</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {Math.round(sentiment.credibilityImpact.modifier * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {sentiment.credibilityImpact.explanation}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Why this matters:</strong> Content with high emotional manipulation
                is {Math.round((1 - sentiment.credibilityImpact.modifier) * 100)}% less likely
                to be factually accurate based on historical patterns.
              </p>
            </div>
          </div>
        )}

        {/* Manipulation Tactics */}
        {sentiment.manipulationTactics && sentiment.manipulationTactics.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                Manipulation Tactics Detected ({sentiment.manipulationTactics.length})
              </h4>
            </div>
            <div className="space-y-3">
              {sentiment.manipulationTactics.map((tactic, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-red-900 dark:text-red-100">
                        {tactic.tactic}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tactic.description}
                      </p>
                      {tactic.examples.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Examples found:
                          </p>
                          {tactic.examples.map((example, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded"
                            >
                              &quot;{example}&quot;
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Emotions */}
        {sentiment.targetEmotions && sentiment.targetEmotions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-semibold">Targeted Emotions</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {sentiment.targetEmotions.map((emotion, index) => {
                const formatted = formatEmotionName(emotion);
                return (
                  <Badge
                    key={index}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                  >
                    <span className="mr-1">{formatted.emoji}</span>
                    {formatted.name}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              This content appears designed to trigger these emotional responses, which can
              bypass critical thinking and make false claims more believable.
            </p>
          </div>
        )}

        {/* Linguistic Red Flags */}
        {sentiment.linguisticRedFlags && sentiment.linguisticRedFlags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                Linguistic Red Flags ({sentiment.linguisticRedFlags.length})
              </h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sentiment.linguisticRedFlags.map((flag, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs bg-orange-100 dark:bg-orange-900/20 flex-shrink-0"
                    >
                      {flag.type.replace(/_/g, " ")}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100 break-words">
                        &quot;{flag.phrase}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {flag.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interpretation Guide */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">
                <strong>💡 Why Sentiment Analysis Matters:</strong> False information often
                uses emotional manipulation to bypass critical thinking. Content designed to
                provoke strong emotional reactions (fear, anger, outrage) is statistically
                more likely to contain false or misleading claims.
              </p>
              {sentiment.credibilityImpact && (
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Research shows:</strong> Claims with high emotional intensity are
                  3x more likely to be false compared to neutral, fact-based reporting.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

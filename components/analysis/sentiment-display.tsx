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
} from "lucide-react";

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
}

interface SentimentDisplayProps {
  sentiment: SentimentAnalysisData;
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

export function SentimentDisplay({ sentiment }: SentimentDisplayProps) {
  if (!sentiment) return null;

  const hasWarnings = sentiment.flags.length > 0 || sentiment.emotionalIntensity >= 0.7;

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

        {/* Interpretation Guide */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-muted-foreground">
            <strong>💡 What this means:</strong> Sentiment analysis helps identify
            emotionally charged or manipulative content. High emotional intensity or
            multiple warning flags suggest the content may be designed to provoke
            reactions rather than inform.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

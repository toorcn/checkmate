"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, TrendingUpIcon, ShieldCheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface OverviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  metric?: {
    value: string | number;
    label: string;
  };
  listItems?: string[];
}

export function AnalysisOverviewCard({
  title,
  description,
  icon,
  onClick,
  variant = "default",
  metric,
  listItems,
}: OverviewCardProps) {
  const variantStyles = {
    default: "border hover:border-muted-foreground/20 bg-card",
    success: "border hover:border-primary/30 bg-card shadow-sm",
    warning: "border hover:border-muted-foreground/30 bg-card",
    danger: "border-destructive/20 hover:border-destructive/30 bg-card",
    info: "border hover:border-muted-foreground/30 bg-card",
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${variantStyles[variant]} border-l-4`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-muted/30 shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1 truncate">{title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {description}
              </p>
              {listItems && listItems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {listItems.map((item, index) => (
                    <li
                      key={index}
                      className="text-xs text-foreground flex items-start gap-1.5"
                    >
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {metric && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
              )}
            </div>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

interface VerdictOverviewCardProps {
  verdict: string;
  confidence: number;
  verdictDefinition: string;
  reasoning: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
  onClick: () => void;
}

export function VerdictOverviewCard({
  verdict,
  confidence,
  verdictDefinition,
  reasoning,
  icon,
  badge,
  onClick,
}: VerdictOverviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger the main onClick if not clicking the toggle button
    const target = e.target as HTMLElement;
    if (!target.closest('[data-toggle-button]')) {
      onClick();
    }
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
        verdict === "verified" || verdict === "true"
          ? "border-l-primary bg-card shadow-sm"
          : verdict === "false" || verdict === "debunked"
            ? "border-l-destructive bg-card"
            : verdict === "misleading" || verdict === "exaggerated"
              ? "border-l-muted-foreground bg-card"
              : verdict === "satire"
                ? "border-l-muted-foreground bg-card"
                : "border-l-muted-foreground bg-card"
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-muted/30">
                {icon}
              </div>
              <h4 className="font-semibold text-base">Verification Status</h4>
            </div>
            <div className="flex items-center gap-2">
              {badge}
              <button
                data-toggle-button
                onClick={toggleExpanded}
                className="p-1 rounded-md hover:bg-muted/50 transition-colors"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {isExpanded && (
            <>
              {/* Verdict Definition - What this status means */}
              <div className="bg-muted/30 rounded-md p-2.5 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Status Meaning:</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {verdictDefinition}
                </p>
              </div>

              {/* AI Reasoning - Why the agent thinks this */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning:</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {confidence}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <button
              data-toggle-button
              onClick={toggleExpanded}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {isExpanded ? (
                <>Hide Details <ChevronUpIcon className="h-3 w-3" /></>
              ) : (
                <>Show Details <ChevronDownIcon className="h-3 w-3" /></>
              )}
            </button>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              View Full Analysis <ArrowRightIcon className="h-3 w-3" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsOverviewCardProps {
  confidence: number;
  sourcesCount: number;
  onClick: () => void;
}

export function MetricsOverviewCard({
  confidence,
  sourcesCount,
  onClick,
}: MetricsOverviewCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md border hover:border-muted-foreground/20"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Analysis Metrics</h4>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                  <TrendingUpIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{confidence}%</p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                  <ShieldCheckIcon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sourcesCount}</p>
                  <p className="text-xs text-muted-foreground">Sources</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Click to view detailed metrics and source credibility
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

interface SentimentOverviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  patternMatchConfidence?: number;
  sentimentScores: SentimentScore;
  overall: string;
}

interface PoliticalBiasOverviewCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  biasScore: number;
  confidence?: number;
  biasCategory: {
    label: string;
    position: "left" | "center" | "right";
    color: string;
  };
}

export function SentimentOverviewCard({
  title,
  description,
  icon,
  onClick,
  variant = "default",
  patternMatchConfidence,
  sentimentScores,
  overall,
}: SentimentOverviewCardProps) {
  const variantStyles = {
    default: "border hover:border-muted-foreground/20 bg-card",
    success: "border hover:border-primary/30 bg-card shadow-sm",
    warning: "border hover:border-muted-foreground/30 bg-card",
    danger: "border-destructive/20 hover:border-destructive/30 bg-card",
    info: "border hover:border-muted-foreground/30 bg-card",
  };

  // Get the dominant sentiment bar color
  const getSentimentBarColor = (sentimentType: string) => {
    switch (sentimentType.toLowerCase()) {
      case "positive":
        return "bg-green-500";
      case "negative":
        return "bg-red-500";
      case "neutral":
        return "bg-gray-500";
      case "mixed":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${variantStyles[variant]} border-l-4`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-muted/30 shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>

          {/* Pattern Match Confidence Badge */}
          {patternMatchConfidence !== undefined && (
            <div className="flex items-center justify-between bg-muted/20 rounded-md px-2 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">Pattern Match</span>
              <span className={`text-xs font-bold ${
                patternMatchConfidence >= 80
                  ? "text-green-600 dark:text-green-400"
                  : patternMatchConfidence >= 60
                  ? "text-blue-600 dark:text-blue-400"
                  : patternMatchConfidence >= 40
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {patternMatchConfidence}%
              </span>
            </div>
          )}

          {/* Sentiment Bar Graph Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Sentiment Breakdown</span>
              <span className="text-xs font-semibold text-foreground">
                {overall}
              </span>
            </div>
            <div className="space-y-1">
              {/* Positive */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 dark:text-green-400 w-14">Positive</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getSentimentBarColor("positive")} transition-all duration-300`}
                    style={{ width: `${sentimentScores.positive * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {Math.round(sentimentScores.positive * 100)}%
                </span>
              </div>
              {/* Negative */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 dark:text-red-400 w-14">Negative</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getSentimentBarColor("negative")} transition-all duration-300`}
                    style={{ width: `${sentimentScores.negative * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {Math.round(sentimentScores.negative * 100)}%
                </span>
              </div>
              {/* Neutral */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 w-14">Neutral</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getSentimentBarColor("neutral")} transition-all duration-300`}
                    style={{ width: `${sentimentScores.neutral * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {Math.round(sentimentScores.neutral * 100)}%
                </span>
              </div>
              {/* Mixed */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-600 dark:text-yellow-400 w-14">Mixed</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getSentimentBarColor("mixed")} transition-all duration-300`}
                    style={{ width: `${sentimentScores.mixed * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {Math.round(sentimentScores.mixed * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PoliticalBiasOverviewCard({
  title,
  description,
  icon,
  onClick,
  variant = "default",
  biasScore,
  confidence,
  biasCategory,
}: PoliticalBiasOverviewCardProps) {
  const variantStyles = {
    default: "border hover:border-muted-foreground/20 bg-card",
    success: "border hover:border-primary/30 bg-card shadow-sm",
    warning: "border hover:border-muted-foreground/30 bg-card",
    danger: "border-destructive/20 hover:border-destructive/30 bg-card",
    info: "border hover:border-muted-foreground/30 bg-card",
  };

  const dotPosition = `${biasScore}%`;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${variantStyles[variant]} border-l-4`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-muted/30 shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>

          {/* Bias Category */}
          <div className="flex items-center justify-between bg-muted/20 rounded-md px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Assessment</span>
            <span className={`text-xs font-bold ${biasCategory.color}`}>
              {biasCategory.label === "Likely leaning toward Opposition" ? "Opposition" :
               biasCategory.label === "Likely leaning toward Pro-Government" ? "Pro-Government" :
               "Neutral"}
            </span>
          </div>

          {/* Political Bias Meter Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Political Bias Meter</span>
              {confidence && (
                <span className="text-xs font-semibold text-muted-foreground">
                  {Math.round(confidence * 100)}% confidence
                </span>
              )}
            </div>
            
            {/* Mini Meter */}
            <div className="relative w-full">
              {/* Meter Background with Color Gradient */}
              <div className="h-2 bg-gradient-to-r from-red-500 via-gray-400 to-green-500 dark:from-red-500 dark:via-gray-500 dark:to-green-500 rounded-full shadow-inner" />
              
              {/* Position Indicator Dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
                style={{ left: dotPosition }}
              >
                {/* Confidence glow */}
                {confidence && confidence >= 0.7 && (
                  <div className="absolute inset-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-amber-400/30 dark:bg-amber-300/20 rounded-full blur-sm animate-pulse" />
                )}
                {/* Main dot */}
                <div className="relative w-3 h-3 bg-amber-600 dark:bg-amber-400 rounded-full border-2 border-white dark:border-gray-900 shadow-md" />
              </div>
              
              {/* End Labels */}
              <div className="flex justify-between text-xs font-medium mt-2 px-1">
                <span className="text-red-600 dark:text-red-400">Opposition</span>
                <span className="text-gray-600 dark:text-gray-400">Neutral</span>
                <span className="text-green-600 dark:text-green-400">Pro-Government</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

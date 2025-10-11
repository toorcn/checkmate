"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, TrendingUpIcon, ShieldCheckIcon, BrainIcon } from "lucide-react";

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
  description: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
  onClick: () => void;
}

export function VerdictOverviewCard({
  verdict,
  confidence,
  description,
  icon,
  badge,
  onClick,
}: VerdictOverviewCardProps) {
  const getVariant = (verdict: string) => {
    if (verdict === "verified" || verdict === "true") return "success";
    if (verdict === "false" || verdict === "debunked") return "danger";
    if (verdict === "misleading" || verdict === "exaggerated") return "warning";
    return "default";
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
      onClick={onClick}
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
            {badge}
          </div>

          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>

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

          <div className="flex items-center justify-end">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              View Details <ArrowRightIcon className="h-3 w-3" />
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

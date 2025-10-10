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
    default: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900",
    success: "border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 bg-green-50/50 dark:bg-green-900/10",
    warning: "border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10",
    danger: "border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 bg-red-50/50 dark:bg-red-900/10",
    info: "border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10",
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${variantStyles[variant]} border-l-4`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
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
                      className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5"
                    >
                      <span className="text-blue-500 mt-0.5">•</span>
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
          ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/10"
          : verdict === "false" || verdict === "debunked"
            ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
            : verdict === "misleading" || verdict === "exaggerated"
              ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10"
              : verdict === "satire"
                ? "border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10"
                : "border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                {icon}
              </div>
              <h4 className="font-semibold text-base">Verification Status</h4>
            </div>
            {badge}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {confidence}%
            </span>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
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
      className="cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{confidence}%</p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ShieldCheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
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

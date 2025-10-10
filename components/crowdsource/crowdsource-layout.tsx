/**
 * CrowdsourceLayout - Layout for crowdsource page
 */

"use client";

import { NewsArticlesList } from "./news-articles-list";
import { VotingStats } from "./voting-stats";
import { Sparkles } from "lucide-react";

/**
 * Props for the CrowdsourceLayout component
 */
interface CrowdsourceLayoutProps {
  /** The title to display */
  title: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * CrowdsourceLayout component handles the layout structure for the crowdsource page
 */
export const CrowdsourceLayout = ({
  title,
  className,
}: CrowdsourceLayoutProps) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto p-4 ${
        className || ""
      }`}
    >
      {/* Main Content Feed */}
      <div className="md:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <NewsArticlesList />
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6 hidden md:block sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pt-15">
        <VotingStats />

        {/* Info Card */}
        <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            How It Works
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              <span>Vote on article credibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              <span>Click &ldquo;Analyze with AI&rdquo; for detailed fact-checking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              <span>Join community discussions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">4.</span>
              <span>Help fight misinformation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * CrowdsourceLayout - Layout for crowdsource page
 */

"use client";

import { NewsArticlesList } from "./news-articles-list";
import { VotingStats } from "./voting-stats";

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
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto p-4 ${className || ""}`}
    >
      {/* Main Content Feed */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-2">
            Vote on news articles to help determine their credibility
          </p>
        </div>
        <NewsArticlesList />
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6 hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
        <VotingStats />
      </div>
    </div>
  );
};

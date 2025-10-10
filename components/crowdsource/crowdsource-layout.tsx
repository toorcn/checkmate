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
    <div className={`min-h-screen bg-gradient-to-b from-background to-muted/20 ${className || ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                Help verify news credibility through community voting and AI-powered analysis. 
                Vote on articles and analyze them to fight misinformation together.
              </p>
            </div>

            {/* Articles List */}
            <NewsArticlesList />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 hidden lg:block">
            <div className="sticky top-24 space-y-6">
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
        </div>
      </div>
    </div>
  );
};

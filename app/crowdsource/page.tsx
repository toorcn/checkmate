/**
 * Crowdsource Page - Server component for community news voting
 *
 * This page shows:
 * - Real news from NewsAPI
 * - Community voting on news credibility
 * - Fake analysis for each news item
 */

import { Metadata } from "next";
import { CrowdsourcePageContent } from "@/components/crowdsource";

/**
 * Metadata for the crowdsource page
 */
export const metadata: Metadata = {
  title: "Crowdsource News Verification | Checkmate",
  description:
    "Help verify news credibility through community voting. Vote on real news articles and contribute to fighting misinformation.",
  keywords: [
    "crowdsourcing",
    "news verification",
    "community voting",
    "fact checking",
    "credibility",
  ],
};

/**
 * Crowdsource page server component
 */
export default function CrowdsourcePage() {
  return <CrowdsourcePageContent />;
}

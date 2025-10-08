/**
 * Article Page - Full article view with all details and comments
 */

import { Metadata } from "next";
import { ArticlePageContent } from "@/components/crowdsource";

interface ArticlePageProps {
  params: Promise<{
    articleId: string;
  }>;
}

/**
 * Generate metadata for the article page
 */
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { articleId } = await params;
  
  // Use generic metadata since we can't reliably fetch article data server-side
  return {
    title: `Article ${articleId} | Checkmate`,
    description: "Read the full article and join the community discussion on Checkmate.",
    keywords: [
      "news verification",
      "fact checking",
      "community discussion",
      "credibility",
    ],
    openGraph: {
      title: `Article ${articleId} | Checkmate`,
      description: "Read the full article and join the community discussion on Checkmate.",
      type: "article",
    },
  };
}

/**
 * Article page server component
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params;
  
  // Let the client component handle article fetching and validation
  // This avoids server-side fetch issues and allows for better error handling
  return <ArticlePageContent articleId={articleId} />;
}

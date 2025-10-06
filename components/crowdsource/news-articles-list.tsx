/**
 * NewsArticlesList - Displays news articles from NewsAPI with voting
 */

"use client";

import { useState, useEffect } from "react";
import { NewsArticleCard } from "./news-article-card";
import { Loader2 } from "lucide-react";

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  publishedAt: string;
  content: string;
  votes: {
    credible: number;
    notCredible: number;
    unsure: number;
  };
  analysis: {
    verdict: "Verified" | "Misleading" | "Unverifiable" | "False";
    confidence: number;
    summary: string;
    keyPoints: string[];
  };
}

/**
 * NewsArticlesList component fetches and displays news articles
 */
export const NewsArticlesList = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/crowdsource/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      const data = await response.json();
      setArticles(data.articles);
    } catch (err) {
      setError("Failed to load news articles. Please try again later.");
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (
    articleId: string,
    voteType: "credible" | "notCredible" | "unsure"
  ) => {
    try {
      const response = await fetch("/api/crowdsource/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articleId, voteType }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      // Update local state
      setArticles((prev) =>
        prev.map((article) => {
          if (article.id === articleId) {
            return {
              ...article,
              votes: {
                ...article.votes,
                [voteType]: article.votes[voteType] + 1,
              },
            };
          }
          return article;
        })
      );
    } catch (err) {
      console.error("Error submitting vote:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No news articles available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <NewsArticleCard
          key={article.id}
          article={article}
          onVote={handleVote}
        />
      ))}
    </div>
  );
};

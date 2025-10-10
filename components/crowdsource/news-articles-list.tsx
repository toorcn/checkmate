/**
 * NewsArticlesList - Displays news articles from NewsAPI with voting
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { NewsArticleCard } from "./news-article-card";
import { ArticleFilters, FilterOptions } from "./article-filters";
import { ArticleSearch } from "./article-search";
import { ArticleSort, SortOption } from "./article-sort";
import { ArticlePagination } from "./article-pagination";
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
  hasAnalysis: boolean;
  analysis: {
    verdict: string;
    confidence: number;
    summary: string;
    keyPoints: string[];
    sentiment?: any;
    factsVerified?: number;
  } | null;
}

/**
 * NewsArticlesList component fetches and displays news articles
 */
export const NewsArticlesList = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter, search, sort, and pagination state
  const [filters, setFilters] = useState<FilterOptions>({
    verdict: "all",
    source: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Get available sources for filter
  const availableSources = useMemo(() => {
    const sources = new Set(articles.map((a) => a.source.name));
    return Array.from(sources).sort();
  }, [articles]);

  // Filter, search, and sort articles
  const filteredAndSortedArticles = useMemo(() => {
    let result = [...articles];

    // Apply filters
    if (filters.verdict !== "all") {
      result = result.filter((article) => {
        if (!article.analysis) return false;
        const verdict = article.analysis.verdict.toLowerCase();
        return verdict.includes(filters.verdict.toLowerCase());
      });
    }

    if (filters.source !== "all") {
      result = result.filter((article) => article.source.name === filters.source);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.description?.toLowerCase().includes(query) ||
          article.source.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        break;
      case "votes":
        result.sort((a, b) => {
          const totalVotesA = a.votes.credible + a.votes.notCredible + a.votes.unsure;
          const totalVotesB = b.votes.credible + b.votes.notCredible + b.votes.unsure;
          return totalVotesB - totalVotesA;
        });
        break;
      case "credibility":
        result.sort((a, b) => {
          const confidenceA = a.analysis?.confidence || 0;
          const confidenceB = b.analysis?.confidence || 0;
          return confidenceB - confidenceA;
        });
        break;
      case "analyzed":
        result.sort((a, b) => {
          if (a.hasAnalysis && !b.hasAnalysis) return -1;
          if (!a.hasAnalysis && b.hasAnalysis) return 1;
          return 0;
        });
        break;
    }

    return result;
  }, [articles, filters, searchQuery, sortBy]);

  // Paginate articles
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedArticles.slice(startIndex, endIndex);
  }, [filteredAndSortedArticles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedArticles.length / itemsPerPage);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortBy]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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
      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
        <ArticleSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultsCount={filteredAndSortedArticles.length}
        />
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <ArticleFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableSources={availableSources}
          />
          <ArticleSort sortBy={sortBy} onSortChange={setSortBy} />
        </div>
      </div>

      {/* Articles List */}
      {filteredAndSortedArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No articles match your filters. Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {paginatedArticles.map((article) => (
              <NewsArticleCard
                key={article.id}
                article={article}
                onVote={handleVote}
              />
            ))}
          </div>

          {/* Pagination */}
          <ArticlePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedArticles.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}
    </div>
  );
};

/**
 * ArticlePageContent - Full article view with all details and comments
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { CommentsSection } from "./comments-section";
import { VotingStats } from "./voting-stats";
import { NewsArticle } from "./news-articles-list";
import { cn } from "@/lib/utils";

interface ArticlePageContentProps {
  articleId: string;
}

/**
 * ArticlePageContent component displays a full article with all details
 */
export const ArticlePageContent = ({ articleId }: ArticlePageContentProps) => {
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/crowdsource/news");
      if (!response.ok) {
        throw new Error("Failed to fetch article");
      }
      const data = await response.json();
      const foundArticle = data.articles.find((a: NewsArticle) => a.id === articleId);
      
      if (!foundArticle) {
        throw new Error("Article not found");
      }
      
      setArticle(foundArticle);
    } catch (err) {
      setError("Failed to load article. Please try again later.");
      console.error("Error fetching article:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: "credible" | "notCredible" | "unsure") => {
    if (!hasVoted && article) {
      try {
        const response = await fetch("/api/crowdsource/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleId: article.id, voteType }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit vote");
        }

        // Update local state
        setArticle((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            votes: {
              ...prev.votes,
              [voteType]: prev.votes[voteType] + 1,
            },
          };
        });
        
        setHasVoted(true);
      } catch (err) {
        console.error("Error submitting vote:", err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Verified":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Misleading":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "False":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "Verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Misleading":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "False":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-destructive">{error || "Article not found"}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalVotes = article.votes.credible + article.votes.notCredible + article.votes.unsure;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Button>

      {/* Article Header */}
      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-4">
            {article.urlToImage && (
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-48 h-48 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-sm">
                  {article.source.name}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-sm flex items-center gap-1", getVerdictColor(article.analysis.verdict))}
                >
                  {getVerdictIcon(article.analysis.verdict)}
                  {article.analysis.verdict}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold leading-tight mb-4">
                {article.title}
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                {article.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.publishedAt)}
                </span>
                {article.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    By {article.author}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Voting Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Community Rating</h2>
            </div>
            <Badge variant="secondary" className="text-sm">
              {totalVotes} total votes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote("credible")}
              disabled={hasVoted}
              className={cn(
                "gap-2 px-6",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              <span className="font-medium">Credible</span>
              <Badge variant="secondary">{article.votes.credible}</Badge>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote("unsure")}
              disabled={hasVoted}
              className={cn(
                "gap-2 px-6",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Unsure</span>
              <Badge variant="secondary">{article.votes.unsure}</Badge>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote("notCredible")}
              disabled={hasVoted}
              className={cn(
                "gap-2 px-6",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              <span className="font-medium">Not Credible</span>
              <Badge variant="secondary">{article.votes.notCredible}</Badge>
            </Button>
          </div>
          
          {hasVoted && (
            <div className="text-center text-sm text-muted-foreground">
              Thank you for your vote! Your contribution helps the community.
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            AI Analysis
            <Badge variant="outline" className="ml-auto">
              {article.analysis.confidence}% confidence
            </Badge>
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Summary</h3>
            <p className="text-muted-foreground leading-relaxed">
              {article.analysis.summary}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-3">Key Points</h3>
            <ul className="space-y-2">
              {article.analysis.keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="text-muted-foreground flex items-start gap-3"
                >
                  <span className="text-primary font-bold mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Full Article Content */}
      {article.content && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Full Article</h2>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {article.content}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <CommentsSection articleId={article.id} />

      {/* Read Original Article */}
      <Card>
        <CardContent className="pt-6">
          <Button
            asChild
            className="w-full gap-2"
            size="lg"
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read Original Article
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * NewsArticleCard - Individual news article with voting and analysis
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { NewsArticle } from "./news-articles-list";
import { cn } from "@/lib/utils";

interface NewsArticleCardProps {
  article: NewsArticle;
  onVote: (
    articleId: string,
    voteType: "credible" | "notCredible" | "unsure"
  ) => void;
}

/**
 * NewsArticleCard component displays a single news article with voting
 */
export const NewsArticleCard = ({ article, onVote }: NewsArticleCardProps) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (voteType: "credible" | "notCredible" | "unsure") => {
    if (!hasVoted) {
      onVote(article.id, voteType);
      setHasVoted(true);
    }
  };

  const totalVotes =
    article.votes.credible + article.votes.notCredible + article.votes.unsure;

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-4">
          {article.urlToImage && (
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {article.source.name}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs", getVerdictColor(article.analysis.verdict))}
              >
                {article.analysis.verdict}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 mb-2">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.description}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.publishedAt)}
              </span>
              {article.author && (
                <span className="line-clamp-1">By {article.author}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Voting Section */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rate this article:</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {totalVotes} votes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("credible")}
              disabled={hasVoted}
              className={cn(
                "gap-1",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">{article.votes.credible}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("unsure")}
              disabled={hasVoted}
              className={cn(
                "gap-1",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs">{article.votes.unsure}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("notCredible")}
              disabled={hasVoted}
              className={cn(
                "gap-1",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-xs">{article.votes.notCredible}</span>
            </Button>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full justify-between"
          >
            <span className="font-medium">
              AI Analysis ({article.analysis.confidence}% confidence)
            </span>
            {showAnalysis ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showAnalysis && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div>
                <h4 className="text-sm font-medium mb-1">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {article.analysis.summary}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {article.analysis.keyPoints.map((point, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Read More Link */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full gap-2"
        >
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Read Full Article
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

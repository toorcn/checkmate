/**
 * NewsArticleCard - Individual news article with voting and AI analysis
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { NewsArticle } from "./news-articles-list";
import { CommentsSection } from "./comments-section";
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
  const router = useRouter();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(article.analysis);
  const [hasAnalysis, setHasAnalysis] = useState(article.hasAnalysis);

  const handleVote = (voteType: "credible" | "notCredible" | "unsure") => {
    if (!hasVoted) {
      onVote(article.id, voteType);
      setHasVoted(true);
    }
  };

  const handleAnalyze = async () => {
    if (isAnalyzing || hasAnalysis) return;

    setIsAnalyzing(true);
    setShowAnalysis(true);

    try {
      const response = await fetch("/api/crowdsource/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          source: article.source.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setHasAnalysis(true);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze article. Please try again.");
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalVotes =
    article.votes.credible + article.votes.notCredible + article.votes.unsure;

  const getVerdictColor = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes("verified") || lowerVerdict.includes("true")) {
      return "bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-600 border-green-500/30";
    } else if (
      lowerVerdict.includes("misleading") ||
      lowerVerdict.includes("context") ||
      lowerVerdict.includes("outdated")
    ) {
      return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 text-yellow-600 border-yellow-500/30";
    } else if (lowerVerdict.includes("false") || lowerVerdict.includes("debunked")) {
      return "bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-600 border-red-500/30";
    } else if (lowerVerdict.includes("opinion")) {
      return "bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-600 border-purple-500/30";
    }
    return "bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-600 border-gray-500/30";
  };

  const getVerdictIcon = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes("verified") || lowerVerdict.includes("true")) {
      return <CheckCircle2 className="h-3 w-3" />;
    } else if (
      lowerVerdict.includes("misleading") ||
      lowerVerdict.includes("context")
    ) {
      return <AlertTriangle className="h-3 w-3" />;
    } else if (lowerVerdict.includes("false")) {
      return <XCircle className="h-3 w-3" />;
    }
    return null;
  };

  const getSentimentColor = (sentiment: any) => {
    if (!sentiment) return "text-gray-500";
    const score = sentiment.sentimentScore?.Score || 0;
    if (score > 0.3) return "text-green-500";
    if (score < -0.3) return "text-red-500";
    return "text-gray-500";
  };

  const getSentimentLabel = (sentiment: any) => {
    if (!sentiment) return "Neutral";
    const score = sentiment.sentimentScore?.Score || 0;
    if (score > 0.3) return "Positive";
    if (score < -0.3) return "Negative";
    return "Neutral";
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
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-border">
      <CardHeader className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          {article.urlToImage && (
            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-40 h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className="text-xs font-medium">
                {article.source.name}
              </Badge>
              {hasAnalysis && analysis && (
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium flex items-center gap-1", getVerdictColor(analysis.verdict))}
                >
                  {getVerdictIcon(analysis.verdict)}
                  {analysis.verdict}
                </Badge>
              )}
            </div>
            <h3
              className="text-xl font-bold line-clamp-2 mb-3 cursor-pointer hover:text-primary transition-colors leading-tight"
              onClick={() => router.push(`/crowdsource/${article.id}`)}
            >
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
              {article.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(article.publishedAt)}
              </span>
              {article.author && (
                <span className="line-clamp-1 flex items-center gap-1.5">
                  <span className="text-muted-foreground/60">By</span>
                  {article.author}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        {/* Voting Section */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Rate this article:</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">{totalVotes} votes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("credible")}
              disabled={hasVoted}
              className={cn(
                "gap-1.5 transition-all hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-medium">{article.votes.credible}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("unsure")}
              disabled={hasVoted}
              className={cn(
                "gap-1.5 transition-all hover:bg-gray-500/10 hover:text-gray-600 hover:border-gray-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{article.votes.unsure}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("notCredible")}
              disabled={hasVoted}
              className={cn(
                "gap-1.5 transition-all hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-xs font-medium">{article.votes.notCredible}</span>
            </Button>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="space-y-3">
          {!hasAnalysis ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full justify-between hover:bg-muted/50"
              >
                <span className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Analysis
                  {analysis && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {analysis.confidence}% confidence
                    </span>
                  )}
                </span>
                {showAnalysis ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAnalysis && analysis && (
                <div className="space-y-4 p-5 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/50">
                  {/* Confidence Meter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Confidence Level</span>
                      <span className="font-semibold">{analysis.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          analysis.confidence >= 80
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : analysis.confidence >= 60
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                        )}
                        style={{ width: `${analysis.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Key Points */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Key Points</h4>
                    <ul className="space-y-2">
                      {analysis.keyPoints?.map((point: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-3"
                        >
                          <span className="text-primary font-bold mt-0.5 flex-shrink-0">•</span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sentiment & Facts */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                    {analysis.sentiment && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Sentiment:
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getSentimentColor(analysis.sentiment))}
                        >
                          {getSentimentLabel(analysis.sentiment)}
                        </Badge>
                      </div>
                    )}
                    {analysis.factsVerified !== undefined && analysis.factsVerified > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Facts Verified:
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {analysis.factsVerified}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Comments Section */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="w-full justify-between hover:bg-muted/50"
          >
            <span className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Community Discussion
            </span>
            {showComments ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showComments && (
            <div className="mt-2">
              <CommentsSection articleId={article.id} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/crowdsource/${article.id}`)}
            className="flex-1 gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            View Full Article
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Original
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

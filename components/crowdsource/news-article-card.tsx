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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border">
      <CardHeader className="space-y-2.5 p-3">
        <div className="flex items-start gap-4">
          {article.urlToImage && (
            <div className="relative overflow-hidden rounded-lg flex-shrink-0">
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-28 h-28 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-medium">
                {article.source.name}
              </Badge>
              {hasAnalysis && analysis && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium flex items-center gap-1", getVerdictColor(analysis.verdict))}
                >
                  {/* Verdict icon is already small */}
                  {getVerdictIcon(analysis.verdict)}
                  {analysis.verdict}
                </Badge>
              )}
            </div>
            <h3
              className="text-base font-semibold line-clamp-2 mb-2 cursor-pointer hover:text-primary transition-colors leading-snug"
              onClick={() => router.push(`/crowdsource/${article.id}`)}
            >
              {article.title}
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {article.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
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

      <CardContent className="space-y-2.5 px-3 pb-3">
        {/* Voting Section */}
        <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-md border border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium">Rate</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-[10px]">{totalVotes}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("credible")}
              disabled={hasVoted}
              className={cn(
                "gap-1 transition-all h-7 px-2 text-[11px] hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="text-[10px] font-medium">{article.votes.credible}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("unsure")}
              disabled={hasVoted}
              className={cn(
                "gap-1 transition-all h-7 px-2 text-[11px] hover:bg-gray-500/10 hover:text-gray-600 hover:border-gray-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <HelpCircle className="h-3 w-3" />
              <span className="text-[10px] font-medium">{article.votes.unsure}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote("notCredible")}
              disabled={hasVoted}
              className={cn(
                "gap-1 transition-all h-7 px-2 text-[11px] hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsDown className="h-3 w-3" />
              <span className="text-[10px] font-medium">{article.votes.notCredible}</span>
            </Button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2">
          {!hasAnalysis ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="gap-1.5 h-7 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Analyze
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="gap-2 h-7 text-xs hover:bg-muted/50"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              AI Analysis
              {analysis && (
                <span className="text-[10px] font-normal text-muted-foreground">
                  {analysis.confidence}%
                </span>
              )}
              {showAnalysis ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/crowdsource/${article.id}`)}
            className="gap-2 h-7 text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            View Full
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2 h-7 text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Original
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        {/* Analysis Details */}
        {showAnalysis && analysis && (
          <div className="space-y-4">
            {/* Main Analysis Card */}
            <div className={cn(
              "border-l-4 rounded-lg p-4",
              getVerdictColor(analysis.verdict).includes("green") && "border-l-green-500 bg-green-50/50 dark:bg-green-900/10",
              getVerdictColor(analysis.verdict).includes("red") && "border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
              getVerdictColor(analysis.verdict).includes("yellow") && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
              getVerdictColor(analysis.verdict).includes("purple") && "border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10",
              !getVerdictColor(analysis.verdict).includes("green") && 
              !getVerdictColor(analysis.verdict).includes("red") && 
              !getVerdictColor(analysis.verdict).includes("yellow") &&
              !getVerdictColor(analysis.verdict).includes("purple") && "border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10"
            )}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                        {getVerdictIcon(analysis.verdict)}
                      </div>
                      <h5 className="font-semibold text-xs">
                        {analysis.verdict}
                      </h5>
                    </div>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5 border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">
                    {analysis.summary}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        {analysis.confidence}%
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Confidence</p>
                      <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${analysis.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {analysis.factsVerified !== undefined && analysis.factsVerified > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                          {analysis.factsVerified}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Facts</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-500">Verified</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Points if available */}
                {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <p className="font-medium text-[11px] mb-2">Key Findings:</p>
                    <ul className="space-y-1.5">
                      {analysis.keyPoints.slice(0, 3).map((point: string, index: number) => (
                        <li key={index} className="text-[11px] text-muted-foreground flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sentiment Analysis if available */}
                {analysis.sentiment && (
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-[11px]">Sentiment Analysis</p>
                      <Badge variant="outline" className={cn("text-[11px]", getSentimentColor(analysis.sentiment))}>
                        {getSentimentLabel(analysis.sentiment)}
                      </Badge>
                    </div>
                    {analysis.sentiment.sentimentScore && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Tone Score</span>
                          <span className="font-medium">
                            {(analysis.sentiment.sentimentScore.Score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              analysis.sentiment.sentimentScore.Score > 0.3
                                ? "bg-green-500"
                                : analysis.sentiment.sentimentScore.Score < -0.3
                                ? "bg-red-500"
                                : "bg-gray-500"
                            )}
                            style={{ 
                              width: `${Math.abs(analysis.sentiment.sentimentScore.Score) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Belief Drivers if available */}
                {analysis.beliefDrivers && analysis.beliefDrivers.length > 0 && (
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <p className="font-medium text-xs mb-3">Why People Believe This:</p>
                    <div className="space-y-2">
                      {analysis.beliefDrivers.slice(0, 2).map((driver, index) => (
                        <div
                          key={index}
                          className="text-[11px] bg-gray-50 dark:bg-gray-900 p-2 rounded"
                        >
                          <span className="font-semibold">{driver.name}:</span>{" "}
                          <span className="text-muted-foreground">{driver.description}</span>
                        </div>
                      ))}
                      {analysis.beliefDrivers.length > 2 && (
                        <p className="text-[11px] text-muted-foreground italic">
                          +{analysis.beliefDrivers.length - 2} more factors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 h-7 text-xs hover:bg-muted/50"
          >
            <MessageCircle className="h-3 w-3" />
            Discussion
            {showComments ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>

          {showComments && (
            <div className="mt-2">
              <CommentsSection articleId={article.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * ArticlePageContent - Full article view with all details and comments
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CommentsSection } from "./comments-section";
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchArticle = useCallback(async () => {
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
  }, [articleId]);

  const analyzeArticle = useCallback(async () => {
    if (!article || isAnalyzing) return;

    setIsAnalyzing(true);

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
      setArticle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasAnalysis: true,
          analysis: data.analysis,
        };
      });
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [article, isAnalyzing]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Auto-analyze on load if no analysis exists
  useEffect(() => {
    if (article && !article.hasAnalysis && !isAnalyzing) {
      analyzeArticle();
    }
  }, [article, analyzeArticle, isAnalyzing]);

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
      return <CheckCircle2 className="h-5 w-5" />;
    } else if (lowerVerdict.includes("misleading") || lowerVerdict.includes("context")) {
      return <AlertTriangle className="h-5 w-5" />;
    } else if (lowerVerdict.includes("false")) {
      return <XCircle className="h-5 w-5" />;
    }
    return <HelpCircle className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-20">
          <p className="text-destructive text-lg mb-4">{error || "Article not found"}</p>
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalVotes = article.votes.credible + article.votes.notCredible + article.votes.unsure;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 hover:bg-muted/50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Button>

      {/* Article Header */}
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="space-y-6 p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {article.urlToImage && (
              <div className="w-full md:w-64 h-64 flex-shrink-0 overflow-hidden rounded-xl">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="outline" className="text-sm font-medium">
                  {article.source.name}
                </Badge>
                {article.hasAnalysis && article.analysis && (
                  <Badge
                    variant="outline"
                    className={cn("text-sm flex items-center gap-1.5 font-medium", getVerdictColor(article.analysis.verdict))}
                  >
                    {getVerdictIcon(article.analysis.verdict)}
                    {article.analysis.verdict}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl font-bold leading-tight mb-5">
                {article.title}
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {article.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.publishedAt)}
                </span>
                {article.author && (
                  <span className="flex items-center gap-2">
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
      <Card className="shadow-lg">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Community Rating</h2>
            </div>
            <Badge variant="secondary" className="text-sm font-medium">
              {totalVotes} total votes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote("credible")}
              disabled={hasVoted}
              className={cn(
                "gap-2 px-8 flex-1 sm:flex-initial transition-all hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              <span className="font-semibold">Credible</span>
              <Badge variant="secondary" className="ml-2">{article.votes.credible}</Badge>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote("unsure")}
              disabled={hasVoted}
              className={cn(
                "gap-2 px-8 flex-1 sm:flex-initial transition-all hover:bg-gray-500/10 hover:text-gray-600 hover:border-gray-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <HelpCircle className="h-5 w-5" />
              <span className="font-semibold">Unsure</span>
              <Badge variant="secondary" className="ml-2">{article.votes.unsure}</Badge>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleVote("notCredible")}
              disabled={hasVoted}
              className={cn(
                "gap-2 px-8 flex-1 sm:flex-initial transition-all hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30",
                hasVoted && "opacity-50 cursor-not-allowed"
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              <span className="font-semibold">Not Credible</span>
              <Badge variant="secondary" className="ml-2">{article.votes.notCredible}</Badge>
            </Button>
          </div>
          
          {hasVoted && (
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">
                ✓ Thank you for your vote! Your contribution helps the community.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      <Card className="shadow-lg">
        <CardHeader className="p-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Analysis
            {article.hasAnalysis && article.analysis && (
              <Badge variant="outline" className="ml-auto text-sm">
                {article.analysis.confidence}% confidence
              </Badge>
            )}
          </h2>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Analyzing article...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment as we perform comprehensive fact-checking
              </p>
            </div>
          ) : article.hasAnalysis && article.analysis ? (
            <>
              {/* Main Analysis Display - Full Format */}
              <div className={cn(
                "border-l-4 rounded-lg p-6 shadow-sm",
                getVerdictColor(article.analysis.verdict).includes("green") && "border-l-green-500 bg-green-50/50 dark:bg-green-900/10",
                getVerdictColor(article.analysis.verdict).includes("red") && "border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
                getVerdictColor(article.analysis.verdict).includes("yellow") && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10",
                getVerdictColor(article.analysis.verdict).includes("purple") && "border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10",
                !getVerdictColor(article.analysis.verdict).includes("green") && 
                !getVerdictColor(article.analysis.verdict).includes("red") && 
                !getVerdictColor(article.analysis.verdict).includes("yellow") &&
                !getVerdictColor(article.analysis.verdict).includes("purple") && "border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10"
              )}>
                <div className="space-y-5">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                          {getVerdictIcon(article.analysis.verdict)}
                        </div>
                        <h5 className="font-semibold text-xl">
                          {article.analysis.verdict}
                        </h5>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Summary Box */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-5 border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                      {article.analysis.summary}
                    </p>
                  </div>

                  {/* Metrics Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {article.analysis.confidence}%
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence</p>
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${article.analysis.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {article.analysis.factsVerified !== undefined && article.analysis.factsVerified > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {article.analysis.factsVerified}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Facts Verified</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Cross-referenced</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Findings Section */}
                  {article.analysis.keyPoints && article.analysis.keyPoints.length > 0 && (
                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <p className="font-semibold text-base mb-3">Key Findings:</p>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <ul className="space-y-2.5">
                          {article.analysis.keyPoints.map((point, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-3">
                              <span className="text-primary font-bold mt-0.5 flex-shrink-0">•</span>
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Sentiment Analysis */}
                  {article.analysis.sentiment && (
                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-base">Sentiment Analysis</p>
                        <Badge variant="outline" className="text-sm">
                          {article.analysis.sentiment.sentimentScore?.Score > 0.3
                            ? "Positive"
                            : article.analysis.sentiment.sentimentScore?.Score < -0.3
                            ? "Negative"
                            : "Neutral"}
                        </Badge>
                      </div>
                      {article.analysis.sentiment.sentimentScore && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Emotional Tone</span>
                            <span className="font-medium">
                              {(article.analysis.sentiment.sentimentScore.Score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                article.analysis.sentiment.sentimentScore.Score > 0.3
                                  ? "bg-green-500"
                                  : article.analysis.sentiment.sentimentScore.Score < -0.3
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              )}
                              style={{ 
                                width: `${Math.abs(article.analysis.sentiment.sentimentScore.Score) * 100}%` 
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {article.analysis.sentiment.sentimentScore.Score > 0.3
                              ? "Content has a positive emotional tone"
                              : article.analysis.sentiment.sentimentScore.Score < -0.3
                              ? "Content has a negative emotional tone"
                              : "Content maintains a neutral tone"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Belief Drivers */}
                  {article.analysis.beliefDrivers && article.analysis.beliefDrivers.length > 0 && (
                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <p className="font-semibold text-base mb-3">Why People Believe This:</p>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <ul className="space-y-3">
                          {article.analysis.beliefDrivers.map((driver, index) => (
                            <li key={index} className="text-sm">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {driver.name}:
                              </span>{" "}
                              <span className="text-muted-foreground">{driver.description}</span>
                              {driver.references && driver.references.length > 0 && (
                                <div className="mt-1 ml-4">
                                  {driver.references.map((ref, refIndex) => (
                                    <a
                                      key={refIndex}
                                      href={ref.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline block"
                                    >
                                      → {ref.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No analysis available yet</p>
              <Button onClick={analyzeArticle} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Analyze Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Article Content */}
      {article.content && (
        <Card className="shadow-lg">
          <CardHeader className="p-6">
            <h2 className="text-2xl font-semibold">Full Article</h2>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
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
      <Card className="shadow-lg">
        <CardContent className="p-6">
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

/**
 * CommentsSection - X.com-style comments section for news articles
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CommentCard } from "./comment-card";
import { Comment } from "@/app/api/crowdsource/comments/route";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface CommentsSectionProps {
  articleId: string;
}

/**
 * CommentsSection component displays comments for a news article
 */
export const CommentsSection = ({ articleId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/crowdsource/comments?articleId=${articleId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      setComments(data.comments);
    } catch (err) {
      setError("Failed to load comments. Please try again later.");
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !authorName.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/crowdsource/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          author: authorName,
          content: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit comment");
      }

      // Refresh comments
      await fetchComments();
      setNewComment("");
      setAuthorName("");
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Failed to submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, author: string, content: string) => {
    try {
      const response = await fetch("/api/crowdsource/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          author,
          content,
          parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit reply");
      }

      // Refresh comments
      await fetchComments();
    } catch (err) {
      console.error("Error submitting reply:", err);
      setError("Failed to submit reply. Please try again.");
    }
  };

  const handleVote = async (commentId: string, voteType: "like" | "dislike") => {
    try {
      const response = await fetch("/api/crowdsource/comments/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId, voteType }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      // Update local state
      setComments((prev) => {
        const updateComment = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                [voteType]: comment[voteType] + 1,
              };
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateComment(comment.replies),
              };
            }
            return comment;
          });
        };
        return updateComment(prev);
      });
    } catch (err) {
      console.error("Error submitting vote:", err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Community Discussion
          <Badge variant="secondary" className="ml-auto">
            {comments.length} comments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Textarea
              placeholder="Share your thoughts on this article... Is it credible? Why or why not?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] text-sm"
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Help the community by sharing your analysis
            </p>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || !authorName.trim() || submitting}
              size="sm"
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onVote={handleVote}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

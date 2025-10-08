/**
 * CreatorComments - Component for displaying and managing creator comments
 *
 * Handles comment display, submission, and real-time updates for creator pages.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import React, { useState } from "react";
import { useLanguage } from "@/components/global-translation-provider";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Props for the CreatorComments component
 */
interface CreatorCommentsProps {
  /** Creator ID for the comments */
  creatorId: string;
  /** Platform of the creator */
  platform: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * CreatorComments component handles comment functionality for creator pages
 *
 * @example
 * ```tsx
 * <CreatorComments creatorId="creator123" platform="tiktok" />
 * ```
 */
export const CreatorComments = ({
  creatorId,
  platform,
  className,
}: CreatorCommentsProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userEmail = user?.email ?? null;
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [comments, setComments] = useState<any[] | undefined>(undefined);
  // Load comments from API (PATCH on base route with limit)
  React.useEffect(() => {
    setComments(undefined);
    fetch(
      `/api/creators/${encodeURIComponent(platform)}/${encodeURIComponent(creatorId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      }
    )
      .then((r) => r.json())
      .then((items) => setComments(items))
      .catch(() => setComments([]));
  }, [creatorId, platform]);

  /**
   * Handles comment submission
   */
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !userEmail || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/creators/${encodeURIComponent(platform)}/${encodeURIComponent(creatorId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: newComment.trim(),
            userName: (userEmail.split("@")[0] || "Anonymous") as string,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to post");
      const saved = await res.json();
      setNewComment("");
      // Optimistically prepend
      setComments((prev) => (prev ? [saved, ...prev] : [saved]));
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t.communityComments} ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        {userEmail && (
          <div className="space-y-3">
            <Textarea
              placeholder={t.shareThoughts}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Posting..." : t.postComment}
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments === undefined ? (
            // Loading state
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              {t.noCommentsYet}
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id || comment._id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(comment.userName || t.anonymous).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {comment.userName || t.anonymous}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    {comment.comment || comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

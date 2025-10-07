/**
 * CommentCard - Individual comment with voting and replies
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { Comment } from "@/app/api/crowdsource/comments/route";
import { cn } from "@/lib/utils";

interface CommentCardProps {
  comment: Comment;
  onVote: (commentId: string, voteType: "like" | "dislike") => void;
  onReply: (parentId: string, author: string, content: string) => void;
  level?: number;
}

/**
 * CommentCard component displays a single comment with voting and replies
 */
export const CommentCard = ({ 
  comment, 
  onVote, 
  onReply, 
  level = 0 
}: CommentCardProps) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (voteType: "like" | "dislike") => {
    if (!hasVoted) {
      onVote(comment.id, voteType);
      setHasVoted(true);
    }
  };

  const handleReply = () => {
    if (replyContent.trim() && replyAuthor.trim()) {
      onReply(comment.id, replyAuthor, replyContent);
      setReplyContent("");
      setReplyAuthor("");
      setShowReplyForm(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getCommentTypeIcon = (content: string) => {
    if (content.includes("⚠️") || content.includes("MISINFORMATION") || content.includes("ALERT")) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (content.includes("credible") || content.includes("accurate") || content.includes("verified")) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (content.includes("not sure") || content.includes("unsure") || content.includes("?")) {
      return <HelpCircle className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  const isReply = level > 0;
  const marginLeft = level * 4; // 4 units per level

  return (
    <div className={cn("space-y-2", isReply && "ml-4 border-l-2 border-muted pl-4")}>
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-sm",
        isReply && "bg-muted/30"
      )}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Comment Header */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {comment.author}
                </Badge>
                {getCommentTypeIcon(comment.content)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(comment.timestamp)}
              </div>
            </div>

            {/* Comment Content */}
            <div className="text-sm leading-relaxed">
              {comment.content}
            </div>

            {/* Voting and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote("like")}
                  disabled={hasVoted}
                  className={cn(
                    "h-8 px-2 gap-1 text-xs",
                    hasVoted && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ThumbsUp className="h-3 w-3" />
                  {comment.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote("dislike")}
                  disabled={hasVoted}
                  className={cn(
                    "h-8 px-2 gap-1 text-xs",
                    hasVoted && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ThumbsDown className="h-3 w-3" />
                  {comment.dislikes}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {comment.replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplies(!showReplies)}
                    className="h-8 px-2 gap-1 text-xs"
                  >
                    <MessageCircle className="h-3 w-3" />
                    {comment.replies.length}
                    {showReplies ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 px-2 text-xs"
                >
                  Reply
                </Button>
              </div>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={replyAuthor}
                    onChange={(e) => setReplyAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Textarea
                    placeholder="Add a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim() || !replyAuthor.trim()}
                  >
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent("");
                      setReplyAuthor("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

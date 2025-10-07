/**
 * API Route: GET/POST /api/crowdsource/comments
 * Handles comments on news articles
 */

import { NextRequest, NextResponse } from "next/server";

export interface Comment {
  id: string;
  articleId: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
  parentId?: string;
}

// In-memory storage for comments (in production, use a database)
const comments = new Map<string, Comment[]>();

/**
 * Generate mock comments for demo purposes
 */
function generateMockComments(articleId: string): Comment[] {
  const mockComments = [
    {
      id: `comment-${articleId}-1`,
      articleId,
      author: "FactChecker_Pro",
      content: "This article seems credible based on the sources cited. The information aligns with what I've seen from other reputable outlets.",
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      likes: 23,
      dislikes: 2,
      replies: [
        {
          id: `reply-${articleId}-1-1`,
          articleId,
          author: "NewsAnalyst_2024",
          content: "I agree, but I'd like to see more primary sources for the statistics mentioned.",
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          likes: 8,
          dislikes: 1,
          replies: [],
          parentId: `comment-${articleId}-1`,
        },
      ],
    },
    {
      id: `comment-${articleId}-2`,
      articleId,
      author: "TruthSeeker99",
      content: "⚠️ MISINFORMATION ALERT: This headline is misleading. The actual study shows different results than what's being reported here.",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      likes: 45,
      dislikes: 12,
      replies: [
        {
          id: `reply-${articleId}-2-1`,
          articleId,
          author: "Researcher_Mike",
          content: "Can you provide the link to the original study? I'd like to verify this claim.",
          timestamp: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
          likes: 15,
          dislikes: 0,
          replies: [],
          parentId: `comment-${articleId}-2`,
        },
        {
          id: `reply-${articleId}-2-2`,
          articleId,
          author: "TruthSeeker99",
          content: "Here's the link: [study-url]. The methodology section clearly shows the limitations that weren't mentioned in this article.",
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          likes: 28,
          dislikes: 3,
          replies: [],
          parentId: `comment-${articleId}-2`,
        },
      ],
    },
    {
      id: `comment-${articleId}-3`,
      articleId,
      author: "MediaWatchdog",
      content: "The source has a history of biased reporting on this topic. Take this with a grain of salt and cross-reference with other outlets.",
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      likes: 67,
      dislikes: 8,
      replies: [],
    },
    {
      id: `comment-${articleId}-4`,
      articleId,
      author: "Anonymous_User",
      content: "I'm not sure about this one. The numbers seem off but I can't find the original data to verify. Anyone else have insights?",
      timestamp: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      likes: 12,
      dislikes: 5,
      replies: [],
    },
  ];

  return mockComments;
}

/**
 * GET handler for fetching comments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID required" },
        { status: 400 }
      );
    }

    // Get comments for article (or generate mock if doesn't exist)
    let articleComments = comments.get(articleId);
    if (!articleComments) {
      articleComments = generateMockComments(articleId);
      comments.set(articleId, articleComments);
    }

    return NextResponse.json({
      comments: articleComments,
      total: articleComments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for submitting comments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, author, content, parentId } = body;

    if (!articleId || !author || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newComment: Comment = {
      id: `comment-${articleId}-${Date.now()}`,
      articleId,
      author,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
      parentId,
    };

    // Get existing comments for article
    // eslint-disable-next-line prefer-const
    let articleComments = comments.get(articleId) || [];

    if (parentId) {
      // Add as reply to existing comment
      const addReply = (comments: Comment[]): boolean => {
        for (const comment of comments) {
          if (comment.id === parentId) {
            comment.replies.push(newComment);
            return true;
          }
          if (addReply(comment.replies)) {
            return true;
          }
        }
        return false;
      };
      addReply(articleComments);
    } else {
      // Add as top-level comment
      articleComments.push(newComment);
    }

    // Save back to storage
    comments.set(articleId, articleComments);

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error("Error submitting comment:", error);
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 }
    );
  }
}

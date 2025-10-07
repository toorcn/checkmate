/**
 * API Route: POST /api/crowdsource/comments/vote
 * Handles voting on comments (like/dislike)
 */

import { NextRequest, NextResponse } from "next/server";

// In-memory storage for comment votes (in production, use a database)
const commentVotes = new Map<string, { likes: number; dislikes: number }>();

/**
 * POST handler for voting on comments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, voteType } = body;

    if (!commentId || !voteType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["like", "dislike"].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Get current votes for comment (or initialize if doesn't exist)
    const currentVotes = commentVotes.get(commentId) || {
      likes: 0,
      dislikes: 0,
    };

    // Increment the vote
    currentVotes[voteType as keyof typeof currentVotes]++;

    // Save back to storage
    commentVotes.set(commentId, currentVotes);

    return NextResponse.json({
      success: true,
      votes: currentVotes,
    });
  } catch (error) {
    console.error("Error processing comment vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving comment vote counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID required" },
        { status: 400 }
      );
    }

    const votes = commentVotes.get(commentId) || {
      likes: 0,
      dislikes: 0,
    };

    return NextResponse.json({
      votes,
    });
  } catch (error) {
    console.error("Error retrieving comment votes:", error);
    return NextResponse.json(
      { error: "Failed to retrieve votes" },
      { status: 500 }
    );
  }
}

/**
 * API Route: POST /api/crowdsource/vote
 * Handles voting on news articles
 */

import { NextRequest, NextResponse } from "next/server";

// In-memory storage for votes (in production, use a database)
const votes = new Map<string, { credible: number; notCredible: number; unsure: number }>();

/**
 * POST handler for submitting votes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, voteType } = body;

    if (!articleId || !voteType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["credible", "notCredible", "unsure"].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Get current votes for article (or initialize if doesn't exist)
    const currentVotes = votes.get(articleId) || {
      credible: 0,
      notCredible: 0,
      unsure: 0,
    };

    // Increment the vote
    currentVotes[voteType as keyof typeof currentVotes]++;

    // Save back to storage
    votes.set(articleId, currentVotes);

    return NextResponse.json({
      success: true,
      votes: currentVotes,
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving vote counts
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

    const articleVotes = votes.get(articleId) || {
      credible: 0,
      notCredible: 0,
      unsure: 0,
    };

    return NextResponse.json({
      votes: articleVotes,
    });
  } catch (error) {
    console.error("Error retrieving votes:", error);
    return NextResponse.json(
      { error: "Failed to retrieve votes" },
      { status: 500 }
    );
  }
}

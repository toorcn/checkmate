import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const rows = await db
    .select()
    .from(analyses)
    .orderBy(desc(analyses.createdAt))
    .limit(limit);

  const parseJson = (value: unknown) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const transformed = rows.map((item: any) => ({
    _id: item.id, // for existing UI components expecting `_id`
    id: item.id,
    userId: item.userId,
    videoUrl: item.videoUrl,
    transcription: item.transcription ? { text: item.transcription } : null,
    metadata: parseJson(item.metadata) || null,
    newsDetection: parseJson(item.newsDetection) || null,
    factCheck: parseJson(item.factCheck) || null,
    requiresFactCheck: item.requiresFactCheck === true,
    creatorCredibilityRating: item.creatorCredibilityRating ?? null,
    contentCreatorId: item.contentCreatorId ?? null,
    platform: item.platform ?? null,
    createdAt:
      typeof item.createdAt === "number"
        ? item.createdAt
        : item.createdAt
        ? new Date(item.createdAt).getTime()
        : null,
    updatedAt:
      typeof item.updatedAt === "number"
        ? item.updatedAt
        : item.updatedAt
        ? new Date(item.updatedAt).getTime()
        : null,
  }));

  return NextResponse.json(transformed);
}

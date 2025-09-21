import { NextRequest, NextResponse } from "next/server";
import { listAnalysesByCreator } from "@/lib/db/repo";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || "10"), 100);
  const { creatorId, platform } = await context.params;
  const items = await listAnalysesByCreator(creatorId, platform, limit);

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

  const transformed = (items as any[]).map((item) => ({
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


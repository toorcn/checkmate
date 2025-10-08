import { NextRequest, NextResponse } from "next/server";
import { listTopCreatorsByCredibility } from "@/lib/db/repo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const limit = Number(searchParams.get("limit") || "10");
  const items = await listTopCreatorsByCredibility(platform, limit);
  const transformed = (items as any[]).map((c) => ({
    creatorId: c.id,
    platform: c.platform,
    creatorName: c.creatorName || null,
    credibilityRating: c.credibilityRating ?? 0,
    totalAnalyses: c.totalAnalyses ?? 0,
    lastAnalyzedAt:
      typeof c.lastAnalyzedAt === "number"
        ? c.lastAnalyzedAt
        : c.lastAnalyzedAt
        ? new Date(c.lastAnalyzedAt).getTime()
        : 0,
  }));
  return NextResponse.json(transformed);
}

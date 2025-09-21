import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || "500"), 2000);
  const items = await db.select().from(analyses).limit(limit);
  const stats = (items as any[]).reduce(
    (acc, a: any) => {
      if (a.requiresFactCheck) acc.requiresFactCheck++;
      const news =
        typeof a.newsDetection === "string"
          ? JSON.parse(a.newsDetection || "null")
          : a.newsDetection;
      if (news?.hasNewsContent) acc.hasNewsContent++;
      const fc =
        typeof a.factCheck === "string"
          ? JSON.parse(a.factCheck || "null")
          : a.factCheck;
      const s = fc?.summary;
      if (s) {
        acc.factCheckSummary.verifiedTrue += s.verifiedTrue || 0;
        acc.factCheckSummary.verifiedFalse += s.verifiedFalse || 0;
        acc.factCheckSummary.misleading += s.misleading || 0;
        acc.factCheckSummary.unverifiable += s.unverifiable || 0;
        acc.factCheckSummary.needsVerification += s.needsVerification || 0;
      }
      acc.totalAnalyses++;
      return acc;
    },
    {
      totalAnalyses: 0,
      requiresFactCheck: 0,
      hasNewsContent: 0,
      factCheckSummary: {
        verifiedTrue: 0,
        verifiedFalse: 0,
        misleading: 0,
        unverifiable: 0,
        needsVerification: 0,
      },
    }
  );
  return NextResponse.json(stats);
}

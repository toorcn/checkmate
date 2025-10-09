import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import {
  createAnalysis,
  listAnalysesByUser,
  recordCreatorAnalysis,
} from "@/lib/db/repo";

export async function GET(_req: NextRequest) {
  const authContext = await getAuthContext();
  if (!authContext)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listAnalysesByUser(authContext.userId, 50);

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

  const transformed = items.map((item: any) => ({
    _id: item.id,
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

export async function POST(req: NextRequest) {
  const authContext = await getAuthContext();
  if (!authContext)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id =
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const platform = body?.metadata?.platform as string | undefined;
  await createAnalysis({
    id,
    userId: authContext.userId,
    videoUrl: body.videoUrl,
    transcription: body?.transcription?.text ?? undefined,
    metadata: body.metadata,
    newsDetection: body.newsDetection,
    factCheck: body.factCheck,
    requiresFactCheck: body.requiresFactCheck === true,
    creatorCredibilityRating:
      body.creatorCredibilityRating == null
        ? undefined
        : Math.round(Number(body.creatorCredibilityRating) * 10) / 10, // Keep one decimal place
    contentCreatorId: body.contentCreatorId,
    platform,
  });
  // Update creator aggregates if creator/platform present
  if (body.contentCreatorId && platform) {
    await recordCreatorAnalysis({
      id: String(body.contentCreatorId),
      platform,
      credibilityRating:
        body.creatorCredibilityRating == null
          ? null
          : Math.round(Number(body.creatorCredibilityRating) * 10) / 10, // Keep one decimal place
      at: new Date(),
    });
  }
  return NextResponse.json({ id });
}

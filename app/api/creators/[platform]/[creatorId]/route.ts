import { NextRequest, NextResponse } from "next/server";
import {
  getCreator,
  listAnalysesByCreator,
  listCreatorComments,
  addCreatorComment,
} from "@/lib/db/repo";
import { getAuthContext } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const { creatorId, platform } = await context.params;
  const item = await getCreator(creatorId, platform);
  if (!item) return NextResponse.json(null);
  const normalized = {
    _id: `${item.id}#${item.platform}`,
    creatorId: item.id,
    platform: item.platform,
    creatorName: (item as any).creatorName || null,
    credibilityRating: (item as any).credibilityRating ?? 0,
    totalAnalyses: (item as any).totalAnalyses ?? 0,
    lastAnalyzedAt:
      typeof (item as any).lastAnalyzedAt === "number"
        ? (item as any).lastAnalyzedAt
        : (item as any).lastAnalyzedAt
          ? new Date((item as any).lastAnalyzedAt).getTime()
          : 0,
  };
  return NextResponse.json(normalized);
}

// List analyses for creator
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const { creatorId, platform } = await context.params;
  const body = await req.json().catch(() => ({}) as any);
  const { action } = body as any;
  if (action === "listAnalyses") {
    const { limit } = body as any;
    const items = await listAnalysesByCreator(
      creatorId,
      platform,
      Number(limit) || 10
    );
    return NextResponse.json(items);
  }
  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

// Comments subroutes
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const content = (body?.comment || body?.content || "").toString();
  if (!content.trim())
    return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  const id =
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const { creatorId, platform } = await context.params;
  const saved = await addCreatorComment({
    id,
    creatorId,
    platform,
    userId: ctx.userId,
    userName: body?.userName || undefined,
    content,
  });
  return NextResponse.json(saved);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  // List comments (PATCH chosen to avoid GET body; could be GET with query too)
  const { limit } = (await req.json().catch(() => ({}))) as any;
  const { creatorId, platform } = await context.params;
  const items = await listCreatorComments(
    creatorId,
    platform,
    Number(limit) || 50
  );
  return NextResponse.json(items);
}

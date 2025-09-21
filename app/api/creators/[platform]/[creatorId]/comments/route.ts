import { NextRequest, NextResponse } from "next/server";
import { addCreatorComment, listCreatorComments } from "@/lib/db/repo";
import { getAuthContext } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "50");
  const { creatorId, platform } = await context.params;
  const items = await listCreatorComments(creatorId, platform, limit);
  return NextResponse.json(items);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const auth = await getAuthContext();
  if (!auth)
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
    userId: auth.userId,
    userName: body?.userName || undefined,
    content,
  });
  return NextResponse.json(saved);
}

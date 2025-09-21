import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { deleteAnalysisById, getAnalysisById } from "@/lib/db/repo";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const item = await getAnalysisById(id);
  if (!item) return NextResponse.json(null);

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

  const transformed = {
    id: (item as any).id,
    userId: (item as any).userId,
    videoUrl: (item as any).videoUrl,
    transcription: (item as any).transcription
      ? { text: (item as any).transcription }
      : null,
    metadata: parseJson((item as any).metadata) || null,
    newsDetection: parseJson((item as any).newsDetection) || null,
    factCheck: parseJson((item as any).factCheck) || null,
    requiresFactCheck: (item as any).requiresFactCheck === true,
    creatorCredibilityRating: (item as any).creatorCredibilityRating ?? null,
    contentCreatorId: (item as any).contentCreatorId ?? null,
    platform: (item as any).platform ?? null,
    createdAt:
      typeof (item as any).createdAt === "number"
        ? (item as any).createdAt
        : (item as any).createdAt
        ? new Date((item as any).createdAt).getTime()
        : null,
    updatedAt:
      typeof (item as any).updatedAt === "number"
        ? (item as any).updatedAt
        : (item as any).updatedAt
        ? new Date((item as any).updatedAt).getTime()
        : null,
  };

  return NextResponse.json(transformed);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authContext = await getAuthContext();
  if (!authContext)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const item = await getAnalysisById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((item as any).userId !== authContext.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteAnalysisById(id);
  return NextResponse.json({ success: true });
}

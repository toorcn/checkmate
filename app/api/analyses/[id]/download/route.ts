import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getAnalysisById } from "@/lib/db/repo";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authContext = await getAuthContext();
  if (!authContext)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const item = await getAnalysisById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure the requesting user owns the analysis
  if ((item as any).userId !== authContext.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Best-effort parse of JSON string fields for a friendly export
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

  const exportPayload = {
    id: (item as any).id,
    videoUrl: (item as any).videoUrl,
    userId: (item as any).userId,
    transcription: parseJson((item as any).transcription),
    metadata: parseJson((item as any).metadata),
    newsDetection: parseJson((item as any).newsDetection),
    factCheck: parseJson((item as any).factCheck),
    requiresFactCheck: (item as any).requiresFactCheck,
    creatorCredibilityRating: (item as any).creatorCredibilityRating,
    contentCreatorId: (item as any).contentCreatorId,
    platform: (item as any).platform,
    createdAt: (item as any).createdAt,
    updatedAt: (item as any).updatedAt,
  };

  const body = JSON.stringify(exportPayload, null, 2);
  const fileName = `analysis-${id}.json`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      "Cache-Control": "no-store",
    },
  });
}

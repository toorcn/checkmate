import { NextRequest, NextResponse } from "next/server";
import { withExternalApi, getAuthContextFromRequest } from "@/lib/external-api-middleware";
import { createAnalysis, listAnalysesByUser, recordCreatorAnalysis } from "@/lib/db/repo";

/**
 * External API endpoint for content analyses
 * 
 * This endpoint provides external access to the analyses service
 * with API key authentication and rate limiting.
 * 
 * **Authentication:** API key required (X-API-Key header)
 * **Rate Limiting:** Based on API key tier
 * **CORS:** Enabled for cross-origin requests
 * 
 * **GET Request:** Retrieve analyses for the authenticated user
 * **POST Request:** Create a new analysis
 * 
 * **POST Request Format:**
 * ```json
 * {
 *   "videoUrl": "https://example.com/video.mp4",
 *   "transcription": { "text": "..." },
 *   "metadata": { "title": "...", "platform": "..." },
 *   "factCheck": { "verdict": "verified", "confidence": 85 },
 *   "requiresFactCheck": true,
 *   "creatorCredibilityRating": 7.5,
 *   "contentCreatorId": "creator123",
 *   "platform": "tiktok"
 * }
 * ```
 * 
 * **Response Format:**
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "analysis123",
 *     "userId": "user123",
 *     "videoUrl": "https://example.com/video.mp4",
 *     "transcription": { "text": "..." },
 *     "metadata": { "title": "...", "platform": "..." },
 *     "factCheck": { "verdict": "verified", "confidence": 85 },
 *     "requiresFactCheck": true,
 *     "creatorCredibilityRating": 7.5,
 *     "createdAt": 1640995200000,
 *     "updatedAt": 1640995200000
 *   }
 * }
 * ```
 */
export const GET = withExternalApi({
  requireAuth: true,
  requiredPermissions: ['read'],
  rateLimit: true,
  cors: true
})(async (request: NextRequest) => {
  const authContext = getAuthContextFromRequest(request);
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use the API key's userId or a default user for external API
  const userId = authContext.userId || 'external-api-user';
  const items = await listAnalysesByUser(userId, 50);

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
});

export const POST = withExternalApi({
  requireAuth: true,
  requiredPermissions: ['write'],
  rateLimit: true,
  cors: true
})(async (request: NextRequest) => {
  const authContext = getAuthContextFromRequest(request);
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id =
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const platform = body?.metadata?.platform as string | undefined;
  
  // Use the API key's userId or a default user for external API
  const userId = authContext.userId || 'external-api-user';
  
  await createAnalysis({
    id,
    userId,
    videoUrl: body.videoUrl,
    transcription: body?.transcription?.text ?? undefined,
    metadata: body.metadata,
    newsDetection: body.newsDetection,
    factCheck: body.factCheck,
    requiresFactCheck: body.requiresFactCheck === true,
    creatorCredibilityRating:
      body.creatorCredibilityRating == null
        ? undefined
        : Math.round(Number(body.creatorCredibilityRating)),
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
          : Math.round(Number(body.creatorCredibilityRating)),
      at: new Date(),
    });
  }
  
  return NextResponse.json({ id });
});

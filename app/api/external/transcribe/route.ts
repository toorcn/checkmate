import { NextRequest, NextResponse } from "next/server";
import { withExternalApi } from "@/lib/external-api-middleware";
import { POST as transcribePost } from "../../transcribe/route";

/**
 * External API endpoint for content transcription and analysis
 * 
 * This endpoint provides external access to the transcription service
 * with API key authentication and rate limiting.
 * 
 * **Authentication:** API key required (X-API-Key header)
 * **Rate Limiting:** Based on API key tier
 * **CORS:** Enabled for cross-origin requests
 * 
 * **Request Format:**
 * ```json
 * {
 *   "tiktokUrl": "https://tiktok.com/@user/video/123...",  // OR
 *   "twitterUrl": "https://twitter.com/user/status/123...", // OR
 *   "webUrl": "https://example.com/article",               // OR
 *   "videoUrl": "https://any-video-url.mp4"
 * }
 * ```
 * 
 * **Response Format:**
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "transcription": { "text": "...", "segments": [...], "language": "en" },
 *     "metadata": { "title": "...", "creator": "...", "platform": "..." },
 *     "factCheck": { "verdict": "verified", "confidence": 85, "explanation": "..." },
 *     "requiresFactCheck": true,
 *     "creatorCredibilityRating": 7.5
 *   }
 * }
 * ```
 */
export const POST = withExternalApi({
  requireAuth: true,
  requiredPermissions: ['read'],
  rateLimit: true,
  cors: true
})(async (request: NextRequest) => {
  // Delegate to the main transcribe endpoint
  return await transcribePost(request);
});

/**
 * Health check endpoint for external API
 */
export const GET = withExternalApi({
  requireAuth: false,
  rateLimit: false,
  cors: true
})(async (request: NextRequest) => {
  return NextResponse.json({
    status: "healthy",
    service: "external-transcription-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    supportedPlatforms: ["tiktok", "twitter", "web"],
    features: [
      "video-transcription",
      "fact-checking",
      "credibility-analysis",
      "rate-limiting",
      "api-key-authentication",
    ],
    authentication: {
      type: "api-key",
      header: "X-API-Key",
      required: true
    }
  });
});

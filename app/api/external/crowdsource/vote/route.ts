import { NextRequest, NextResponse } from "next/server";
import { withExternalApi } from "@/lib/external-api-middleware";
import { GET as voteGet, POST as votePost } from "../../../crowdsource/vote/route";

/**
 * External API endpoint for crowdsource voting
 * 
 * This endpoint provides external access to the voting service
 * with API key authentication and rate limiting.
 * 
 * **Authentication:** API key required (X-API-Key header)
 * **Rate Limiting:** Based on API key tier
 * **CORS:** Enabled for cross-origin requests
 * 
 * **POST Request Format:**
 * ```json
 * {
 *   "articleId": "article123",
 *   "voteType": "credible"  // "credible", "notCredible", or "unsure"
 * }
 * ```
 * 
 * **GET Request:** Retrieve vote counts for an article
 * Query parameter: `articleId=article123`
 * 
 * **Response Format:**
 * ```json
 * {
 *   "success": true,
 *   "votes": {
 *     "credible": 15,
 *     "notCredible": 3,
 *     "unsure": 2
 *   }
 * }
 * ```
 */
export const POST = withExternalApi({
  requireAuth: true,
  requiredPermissions: ['write'],
  rateLimit: true,
  cors: true
})(async (request: NextRequest) => {
  // Delegate to the main vote endpoint
  return await votePost(request);
});

export const GET = withExternalApi({
  requireAuth: true,
  requiredPermissions: ['read'],
  rateLimit: true,
  cors: true
})(async (request: NextRequest) => {
  // Delegate to the main vote endpoint
  return await voteGet(request);
});

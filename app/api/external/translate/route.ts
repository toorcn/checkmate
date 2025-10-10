import { NextRequest, NextResponse } from "next/server";
import { withExternalApi } from "@/lib/external-api-middleware";
import { POST as translatePost, GET as translateGet } from "../../translate/route";

/**
 * External API endpoint for text translation
 * 
 * This endpoint provides external access to the translation service
 * with API key authentication and rate limiting.
 * 
 * **Authentication:** API key required (X-API-Key header)
 * **Rate Limiting:** Based on API key tier
 * **CORS:** Enabled for cross-origin requests
 * 
 * **Request Format:**
 * ```json
 * {
 *   "text": "Hello world",           // Single text translation
 *   "texts": ["Hello", "World"],     // OR multiple texts
 *   "targetLanguage": "es",          // Target language code
 *   "sourceLanguage": "auto"         // Optional source language
 * }
 * ```
 * 
 * **Response Format:**
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "translatedText": "Hola mundo",
 *     "sourceLanguage": "en",
 *     "targetLanguage": "es",
 *     "confidence": 0.95
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
  // Delegate to the main translate endpoint
  return await translatePost(request);
});

/**
 * Get supported languages and API information
 */
export const GET = withExternalApi({
  requireAuth: false,
  rateLimit: false,
  cors: true
})(async (request: NextRequest) => {
  // Delegate to the main translate endpoint
  return await translateGet(request);
});

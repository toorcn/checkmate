import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, optionalApiKey, getRateLimitConfig } from "./api-auth";
import { ApiError } from "./api-error";
import { logger } from "./logger";

export interface ExternalApiOptions {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  rateLimit?: boolean;
  cors?: boolean;
}

/**
 * Middleware wrapper for external API endpoints
 * Handles authentication, rate limiting, CORS, and error handling
 */
export function withExternalApi(options: ExternalApiOptions = {}) {
  const {
    requireAuth = true,
    requiredPermissions = [],
    rateLimit = true,
    cors = true
  } = options;

  return function middleware<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest, ...args: T): Promise<NextResponse> {
      const requestId = crypto.randomUUID();
      const startTime = Date.now();

      try {
        // Handle CORS preflight requests
        if (cors && request.method === 'OPTIONS') {
          return new NextResponse(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
              'Access-Control-Max-Age': '86400',
            },
          });
        }

        // Authentication
        let authContext = null;
        if (requireAuth) {
          authContext = await requireApiKey(request, requiredPermissions);
        } else {
          authContext = await optionalApiKey(request);
        }

        // Rate limiting (simplified - in production use Redis or similar)
        if (rateLimit && authContext) {
          // This is a basic implementation - in production, use a proper rate limiter
          const config = getRateLimitConfig(authContext);
          // TODO: Implement actual rate limiting logic
        }

        // Add auth context to request headers for the handler
        const modifiedRequest = new NextRequest(request, {
          headers: {
            ...Object.fromEntries(request.headers.entries()),
            'x-auth-context': JSON.stringify(authContext),
            'x-request-id': requestId,
          },
        });

        // Call the actual handler
        const response = await handler(modifiedRequest, ...args);

        // Add CORS headers to response
        if (cors) {
          response.headers.set('Access-Control-Allow-Origin', '*');
          response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-User-ID');
        }

        // Add request tracking headers
        response.headers.set('X-Request-ID', requestId);
        response.headers.set('X-Processing-Time', (Date.now() - startTime).toString());

        return response;

      } catch (error) {
        const duration = Date.now() - startTime;

        // Handle known API errors
        if (error instanceof ApiError) {
          logger.warn("External API error", {
            requestId,
            duration,
            metadata: {
              statusCode: error.statusCode,
              errorMessage: error.message,
            },
          });

          const response = NextResponse.json(error.toJSON(), {
            status: error.statusCode,
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId,
              'X-Error-Code': error.code,
              ...(cors ? {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
              } : {}),
            },
          });

          return response;
        }

        // Handle unexpected errors
        logger.error("Unexpected error in external API", {
          requestId,
          duration,
          metadata: {
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          },
        });

        const internalError = ApiError.internalError(error as Error);
        return NextResponse.json(internalError.toJSON(), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Error-Code': internalError.code,
            ...(cors ? {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
            } : {}),
          },
        });
      }
    };
  };
}

/**
 * Helper function to extract auth context from request
 */
export function getAuthContextFromRequest(request: NextRequest) {
  const authContextHeader = request.headers.get('x-auth-context');
  if (!authContextHeader) return null;
  
  try {
    return JSON.parse(authContextHeader);
  } catch {
    return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { withExternalApi } from "@/lib/external-api-middleware";

/**
 * External API Documentation and Status Endpoint
 * 
 * This endpoint provides information about the external API,
 * available endpoints, authentication requirements, and usage examples.
 */
export const GET = withExternalApi({
  requireAuth: false,
  rateLimit: false,
  cors: true
})(async (request: NextRequest) => {
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  
  return NextResponse.json({
    name: "Checkmate External API",
    version: "1.0.0",
    description: "External API for content analysis, transcription, and fact-checking services",
    baseUrl: `${baseUrl}/api/external`,
    timestamp: new Date().toISOString(),
    
    authentication: {
      type: "API Key",
      header: "X-API-Key",
      description: "Include your API key in the X-API-Key header",
      example: "X-API-Key: your-api-key-here"
    },
    
    rateLimiting: {
      description: "Rate limits are based on your API key tier",
      tiers: {
        free: "100 requests per hour",
        basic: "1,000 requests per hour", 
        premium: "10,000 requests per hour",
        enterprise: "100,000 requests per hour"
      }
    },
    
    endpoints: [
      {
        path: "/api/external/transcribe",
        methods: ["POST", "GET"],
        description: "Content transcription and analysis",
        authentication: "Required",
        rateLimit: "Yes",
        examples: {
          request: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": "your-api-key-here"
            },
            body: {
              tiktokUrl: "https://tiktok.com/@user/video/123...",
              // OR
              twitterUrl: "https://twitter.com/user/status/123...",
              // OR  
              webUrl: "https://example.com/article",
              // OR
              videoUrl: "https://any-video-url.mp4"
            }
          },
          response: {
            success: true,
            data: {
              transcription: { text: "...", segments: [], language: "en" },
              metadata: { title: "...", creator: "...", platform: "..." },
              factCheck: { verdict: "verified", confidence: 85, explanation: "..." },
              requiresFactCheck: true,
              creatorCredibilityRating: 7.5
            }
          }
        }
      },
      {
        path: "/api/external/translate",
        methods: ["POST", "GET"],
        description: "Text translation service",
        authentication: "Required",
        rateLimit: "Yes",
        examples: {
          request: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": "your-api-key-here"
            },
            body: {
              text: "Hello world",
              targetLanguage: "es",
              sourceLanguage: "auto"
            }
          },
          response: {
            success: true,
            data: {
              translatedText: "Hola mundo",
              sourceLanguage: "en",
              targetLanguage: "es",
              confidence: 0.95
            }
          }
        }
      },
      {
        path: "/api/external/analyses",
        methods: ["GET", "POST"],
        description: "Content analyses management",
        authentication: "Required",
        rateLimit: "Yes",
        examples: {
          request: {
            method: "GET",
            headers: {
              "X-API-Key": "your-api-key-here"
            }
          },
          response: {
            success: true,
            data: [
              {
                id: "analysis123",
                userId: "user123",
                videoUrl: "https://example.com/video.mp4",
                transcription: { text: "..." },
                metadata: { title: "...", platform: "..." },
                factCheck: { verdict: "verified", confidence: 85 },
                requiresFactCheck: true,
                creatorCredibilityRating: 7.5,
                createdAt: 1640995200000,
                updatedAt: 1640995200000
              }
            ]
          }
        }
      },
      {
        path: "/api/external/crowdsource/vote",
        methods: ["GET", "POST"],
        description: "Crowdsource voting on content credibility",
        authentication: "Required",
        rateLimit: "Yes",
        examples: {
          request: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": "your-api-key-here"
            },
            body: {
              articleId: "article123",
              voteType: "credible"
            }
          },
          response: {
            success: true,
            votes: {
              credible: 15,
              notCredible: 3,
              unsure: 2
            }
          }
        }
      }
    ],
    
    errorHandling: {
      description: "All endpoints return consistent error responses",
      format: {
        success: false,
        error: "Error message",
        code: "ERROR_CODE",
        details: "Additional error details"
      },
      commonErrors: [
        {
          code: "UNAUTHORIZED",
          status: 401,
          message: "Valid API key required"
        },
        {
          code: "FORBIDDEN", 
          status: 403,
          message: "Insufficient permissions"
        },
        {
          code: "RATE_LIMITED",
          status: 429,
          message: "Rate limit exceeded"
        },
        {
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Invalid request format"
        },
        {
          code: "INTERNAL_ERROR",
          status: 500,
          message: "Internal server error"
        }
      ]
    },
    
    cors: {
      description: "CORS is enabled for all endpoints",
      allowedOrigins: "*",
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-User-ID"]
    },
    
    support: {
      documentation: `${baseUrl}/api/external`,
      status: `${baseUrl}/api/external/status`,
      contact: "api-support@checkmate.com"
    }
  });
});

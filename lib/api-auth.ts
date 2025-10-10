import { NextRequest } from "next/server";
import { ApiError } from "./api-error";

export interface ApiKeyAuthContext {
  apiKey: string;
  userId?: string;
  permissions: string[];
  rateLimitTier: 'free' | 'basic' | 'premium' | 'enterprise';
}

// In-memory API key storage (in production, use a database)
const API_KEYS = new Map<string, ApiKeyAuthContext>([
  // Demo API key - replace with actual keys in production
  ['demo-key-123', {
    apiKey: 'demo-key-123',
    userId: 'demo-user',
    permissions: ['read', 'write'],
    rateLimitTier: 'free'
  }],
  ['test-key-456', {
    apiKey: 'test-key-456',
    userId: 'test-user',
    permissions: ['read'],
    rateLimitTier: 'basic'
  }]
]);

/**
 * Validates API key from request headers
 * @param request - Next.js request object
 * @returns API key context or null if invalid
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyAuthContext | null> {
  // Check for API key in headers
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return null;
  }

  // Look up API key
  const context = API_KEYS.get(apiKey);
  if (!context) {
    return null;
  }

  return context;
}

/**
 * Middleware function to require API key authentication
 * @param request - Next.js request object
 * @param requiredPermissions - Array of required permissions
 * @returns API key context or throws ApiError
 */
export async function requireApiKey(
  request: NextRequest, 
  requiredPermissions: string[] = []
): Promise<ApiKeyAuthContext> {
  const context = await validateApiKey(request);
  
  if (!context) {
    throw ApiError.unauthorized('Valid API key required');
  }

  // Check permissions
  for (const permission of requiredPermissions) {
    if (!context.permissions.includes(permission)) {
      throw ApiError.forbidden(`Permission '${permission}' required`);
    }
  }

  return context;
}

/**
 * Middleware function for optional API key authentication
 * @param request - Next.js request object
 * @returns API key context or null
 */
export async function optionalApiKey(request: NextRequest): Promise<ApiKeyAuthContext | null> {
  return await validateApiKey(request);
}

/**
 * Get rate limit configuration based on API key tier
 * @param context - API key context
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(context: ApiKeyAuthContext) {
  const configs = {
    free: { requests: 100, window: 3600 }, // 100 requests per hour
    basic: { requests: 1000, window: 3600 }, // 1000 requests per hour
    premium: { requests: 10000, window: 3600 }, // 10000 requests per hour
    enterprise: { requests: 100000, window: 3600 }, // 100000 requests per hour
  };

  return configs[context.rateLimitTier];
}

/**
 * Add API key to the system (for admin use)
 * @param apiKey - The API key
 * @param context - API key context
 */
export function addApiKey(apiKey: string, context: Omit<ApiKeyAuthContext, 'apiKey'>) {
  API_KEYS.set(apiKey, { ...context, apiKey });
}

/**
 * Remove API key from the system (for admin use)
 * @param apiKey - The API key to remove
 */
export function removeApiKey(apiKey: string) {
  API_KEYS.delete(apiKey);
}

/**
 * List all API keys (for admin use)
 * @returns Array of API key contexts (without the actual keys)
 */
export function listApiKeys(): Omit<ApiKeyAuthContext, 'apiKey'>[] {
  return Array.from(API_KEYS.values()).map(({ apiKey, ...context }) => context);
}

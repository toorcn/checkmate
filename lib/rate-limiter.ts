import { NextRequest } from "next/server";
import { config } from "./config";
import { ApiError } from "./api-error";
import { incrementAndGetWindowCount } from "./redisRateLimit";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configurations
export const RATE_LIMITS = {
  anonymous: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: Math.floor(config.RATE_LIMIT_MAX_REQUESTS * 0.2), // 20% of authenticated limit
  },
  authenticated: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  },
  premium: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS * 5, // 5x limit for premium users
  },
} as const;

// Default key generator (IP-based)
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

// User-based key generator
function userKeyGenerator(request: NextRequest, userId: string): string {
  return `user:${userId}`;
}

// Clean up expired entries
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Check rate limit
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
  userId?: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to cleanup
    cleanupExpiredEntries();
  }

  const key = userId
    ? userKeyGenerator(request, userId)
    : (options.keyGenerator || defaultKeyGenerator)(request);
  const now = Date.now();
  const resetTime = now + options.windowMs;

  // Try Redis-backed limiter if configured
  try {
    if (process.env.REDIS_HOST) {
      const windowSec = Math.floor(options.windowMs / 1000);
      const count = await incrementAndGetWindowCount(key, windowSec);
      if (count > options.maxRequests) {
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter,
        };
      }
      return {
        allowed: true,
        remaining: options.maxRequests - count,
        resetTime,
      };
    }
  } catch {
    // fall through to in-memory on any Redis error
  }

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime,
    };
  }

  if (entry.count >= options.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Rate limit middleware
export function createRateLimitMiddleware(
  getUserTier?: (userId: string) => "anonymous" | "authenticated" | "premium"
) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    userId?: string
  ): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
    error?: ApiError;
  }> {
    // Determine user tier
    const tier = userId
      ? getUserTier?.(userId) || "authenticated"
      : "anonymous";
    const options = RATE_LIMITS[tier];

    // Check rate limit
    const result = await checkRateLimit(request, options, userId);

    // Prepare headers
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(options.maxRequests),
      "X-RateLimit-Remaining": String(result.remaining ?? 0),
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    };

    if (!result.allowed) {
      headers["Retry-After"] = String(
        result.retryAfter ?? Math.ceil(options.windowMs / 1000)
      );
      return {
        allowed: false,
        headers,
        error: ApiError.rateLimited(result.retryAfter),
      };
    }

    return {
      allowed: true,
      headers,
    };
  };
}

// Operation-specific rate limits
export const OPERATION_LIMITS = {
  transcribe: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // Very generous: 120/min
  },
  factCheck: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // Generous: 60/min
  },
} as const;

// Operation-specific rate limiter
export async function checkOperationRateLimit(
  request: NextRequest,
  operation: keyof typeof OPERATION_LIMITS,
  userId?: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  const options = OPERATION_LIMITS[operation];
  const keyGenerator = (req: NextRequest) => {
    const base = userId ? `user:${userId}` : defaultKeyGenerator(req);
    return `${base}:${operation}`;
  };

  return checkRateLimit(request, { ...options, keyGenerator }, userId);
}

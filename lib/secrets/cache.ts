/**
 * In-memory cache for AWS Secrets Manager secrets
 * Reduces API calls and improves performance
 */

import { CachedSecret } from "./types";

/**
 * Default TTL for cached secrets (5 minutes)
 * This balances between reducing API calls and getting fresh secrets
 */
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory cache store
 */
const cache = new Map<string, CachedSecret>();

/**
 * Store a secret in cache with TTL
 * @param key - Cache key (usually secret name)
 * @param value - Secret value to cache
 * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
 */
export function setCache<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const expiresAt = Date.now() + ttlMs;
  cache.set(key, { value, expiresAt });
}

/**
 * Get a secret from cache if it exists and hasn't expired
 * @param key - Cache key (usually secret name)
 * @returns Cached value or undefined if not found or expired
 */
export function getCache<T>(key: string): T | undefined {
  const cached = cache.get(key);

  if (!cached) {
    return undefined;
  }

  // Check if cache entry has expired
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return cached.value as T;
}

/**
 * Clear a specific secret from cache
 * @param key - Cache key to clear
 */
export function clearCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all secrets from cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns Object with cache size and entries
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}


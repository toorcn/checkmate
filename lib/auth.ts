import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/secrets";

export type AuthContext = {
  provider: "local";
  subject: string;
  userId: string;
  email: string;
  sessionId?: string;
};

const COOKIE_NAME = "app_session";
const ISSUER = "checkmate.local";
const AUDIENCE = "checkmate.app";

/**
 * Cache for auth secret to avoid fetching from Secrets Manager on every request
 * Auth operations happen frequently, so caching is critical for performance
 */
let cachedSecretKey: Uint8Array | null = null;
let secretKeyPromise: Promise<Uint8Array> | null = null;

/**
 * Get the secret key for JWT signing/verification
 * In production: fetches from AWS Secrets Manager (cached)
 * In local dev: uses AUTH_SECRET from environment variables
 */
async function getSecretKey(): Promise<Uint8Array> {
  // Return cached key if available
  if (cachedSecretKey) {
    return cachedSecretKey;
  }

  // If already fetching, wait for that promise
  if (secretKeyPromise) {
    return secretKeyPromise;
  }

  // Fetch secret (from Secrets Manager or env fallback)
  secretKeyPromise = (async () => {
    try {
      const authSecret = await getAuthSecret();
      const secret = authSecret.secret || "dev-insecure-secret-change";
      const key = new TextEncoder().encode(secret);
      
      // Cache the key
      cachedSecretKey = key;
      secretKeyPromise = null;
      
      return key;
    } catch (error) {
      console.error("[auth] Failed to fetch auth secret:", error);
      // Fallback to dev secret if fetch fails
      const fallbackKey = new TextEncoder().encode("dev-insecure-secret-change");
      cachedSecretKey = fallbackKey;
      secretKeyPromise = null;
      return fallbackKey;
    }
  })();

  return secretKeyPromise;
}

export async function createSessionJWT(payload: {
  sub: string;
  email: string;
  sessionId?: string; // persisted DB session id
  expiresInSeconds?: number;
}): Promise<string> {
  const expiresIn = payload.expiresInSeconds ?? 60 * 60 * 24 * 7; // 7 days
  const claims: Record<string, unknown> = { email: payload.email };
  if (payload.sessionId) claims["sid"] = payload.sessionId;
  
  // Get secret key (from Secrets Manager or env fallback)
  const secretKey = await getSecretKey();
  
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setExpirationTime(`${expiresIn}s`)
    .sign(secretKey);
}

/**
 * Get the auth context from the cookies
 * @returns The auth context
 */

export async function getAuthContext(): Promise<AuthContext | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  
  try {
    // Get secret key (from Secrets Manager or env fallback)
    const secretKey = await getSecretKey();
    
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const sub = String(payload.sub || "");
    const email = String((payload as any).email || "");
    const sessionId = (payload as any).sid
      ? String((payload as any).sid)
      : undefined;
    if (!sub || !email) return null;

    // If a session id is present, ensure it's valid in DB
    if (sessionId) {
      try {
        const { getSessionById } = await import("@/lib/db/repo");
        const s = await getSessionById(sessionId);
        if (!s) return null;
        const now = new Date();
        if (s.revokedAt || (s.expiresAt && s.expiresAt < now)) return null;
        if (s.userId !== sub) return null;
      } catch {
        // If DB lookup fails, treat as unauthenticated to be safe
        return null;
      }
    }

    return {
      provider: "local",
      subject: sub,
      userId: sub,
      email,
      sessionId,
    };
  } catch {
    return null;
  }
}

/**
 * Clear the cached auth secret key
 * Useful for testing or when secrets are rotated
 */
export function clearAuthSecretCache(): void {
  cachedSecretKey = null;
  secretKeyPromise = null;
}

export { COOKIE_NAME };

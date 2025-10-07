import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

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

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change";
  return new TextEncoder().encode(secret);
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
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setExpirationTime(`${expiresIn}s`)
    .sign(getSecretKey());
}

/**
 * Get the auth context from the cookies
 * @returns The auth context
 */

export async function getAuthContext(): Promise<AuthContext | null> {
  const c = await cookies();
  
  // First, check for OAuth tokens (from Google, etc.)
  const idToken = c.get("idToken")?.value;
  if (idToken) {
    try {
      // Decode Cognito ID token (no signature verification needed for now)
      const jwt = await import("jsonwebtoken");
      const decoded = jwt.decode(idToken) as any;
      
      if (decoded && decoded.email && decoded.sub) {
        return {
          provider: "local", // Keep as "local" for compatibility
          subject: decoded.sub,
          userId: decoded.sub,
          email: decoded.email,
          sessionId: undefined, // OAuth doesn't use session IDs
        };
      }
    } catch (error) {
      console.error("Error decoding OAuth ID token:", error);
      // Fall through to check session token
    }
  }
  
  // Fall back to session-based auth (email/password login)
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
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

export { COOKIE_NAME };

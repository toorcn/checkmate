import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/secrets";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/auth/callback",
  "/api/auth",
  "/api/transcribe",
  "/api/analyze-tiktok",
];

const isPublic = (path: string) =>
  PUBLIC_ROUTES.some((p) => path.startsWith(p));

const COOKIE_NAME = "app_session";
const ISSUER = "checkmate.local";
const AUDIENCE = "checkmate.app";

/**
 * Cache for auth secret in middleware
 * Middleware runs on every request, so caching is critical for performance
 */
let cachedSecretKey: Uint8Array | null = null;
let secretKeyPromise: Promise<Uint8Array> | null = null;

/**
 * Get the secret key for JWT verification in middleware
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
      
      if (!secret || secret === "dev-insecure-secret-change") {
        console.warn("[middleware] Using fallback auth secret - check Secrets Manager configuration");
      }
      
      const key = new TextEncoder().encode(secret);
      
      // Cache the key
      cachedSecretKey = key;
      secretKeyPromise = null;
      
      return key;
    } catch (error) {
      console.error("[middleware] Failed to fetch auth secret:", error);
      // Fallback to dev secret if fetch fails
      const fallbackKey = new TextEncoder().encode("dev-insecure-secret-change");
      cachedSecretKey = fallbackKey;
      secretKeyPromise = null;
      return fallbackKey;
    }
  })();

  return secretKeyPromise;
}

export async function middleware(req: Request) {
  const url = new URL(req.url);
  if (isPublic(url.pathname)) return NextResponse.next();

  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice("Bearer ".length)
    : typeof (req as any).cookies?.get === "function"
      ? (req as any).cookies.get(COOKIE_NAME)?.value
      : undefined;

  if (!token) return NextResponse.redirect(new URL("/sign-in", url));

  try {
    // Get secret key (from Secrets Manager or env fallback)
    const secretKey = await getSecretKey();
    
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const res = NextResponse.next();
    res.headers.set("x-auth-provider", "local");
    res.headers.set("x-auth-subject", String(payload.sub));
    return res;
  } catch (err) {
    return NextResponse.redirect(new URL("/sign-in", url));
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

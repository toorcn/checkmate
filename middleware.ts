import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
const getSecretKey = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-insecure-secret-change"
  );

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
    const { payload } = await jwtVerify(token, getSecretKey(), {
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

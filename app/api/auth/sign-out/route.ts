import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { revokeSession } from "@/lib/db/repo";
import { jwtVerify } from "jose";

const ISSUER = "checkmate.local";
const AUDIENCE = "checkmate.app";
const getSecretKey = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-insecure-secret-change"
  );

export async function POST(req: Request) {
  // Best-effort revoke session in DB if present
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    const token = match?.[1];
    if (token) {
      const { payload } = await jwtVerify(token, getSecretKey(), {
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      const sid = (payload as any).sid ? String((payload as any).sid) : undefined;
      if (sid) await revokeSession(sid);
    }
  } catch {}

  const res = new NextResponse(null, { status: 204 });
  
  // Clear session cookie
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
  );
  
  // Clear OAuth cookies (if present)
  res.headers.append(
    "Set-Cookie",
    `accessToken=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
  );
  res.headers.append(
    "Set-Cookie",
    `idToken=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
  );
  res.headers.append(
    "Set-Cookie",
    `refreshToken=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
  );
  
  return res;
}

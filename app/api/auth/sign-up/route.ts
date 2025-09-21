import { NextResponse } from "next/server";
import { createSessionJWT, COOKIE_NAME } from "@/lib/auth";
import { upsertUser, createSession } from "@/lib/db/repo";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return new NextResponse("Invalid body", { status: 400 });
  }
  // Persist user (id = email as stable identifier for now)
  await upsertUser({ id: email, email, username: email.split("@")[0] });
  const sessionId = crypto.randomUUID();
  const maxAgeSec = 60 * 60 * 24 * 7; // 7 days
  const expiresAt = new Date(Date.now() + maxAgeSec * 1000);
  const ua = req.headers.get("user-agent");
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
    .split(",")[0]
    .trim();
  const created = await createSession({
    id: sessionId,
    userId: email,
    userAgent: ua,
    ipAddress: ip || null,
    expiresAt,
  });
  const jwt = await createSessionJWT({ sub: email, email, sessionId: created ? sessionId : undefined });
  const res = new NextResponse(null, { status: 204 });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSec}`
  );
  return res;
}

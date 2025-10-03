import { NextResponse } from "next/server";
import { createSessionJWT, COOKIE_NAME } from "@/lib/auth";
import { upsertUser, createSession } from "@/lib/db/repo";
import { cognitoSignUp, getCognitoUser } from "@/lib/cognito";

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || typeof password !== "string") {
      return new NextResponse("Invalid body", { status: 400 });
    }

    // Create user in Cognito
    const cognitoResult = await cognitoSignUp(email, password, username);
    
    // For new users, we'll use the email as the ID until they sign in
    // and we can get their actual Cognito sub ID
    const userId = cognitoResult.userSub || email;
    const userEmail = email;
    const userUsername = username || email.split("@")[0];

    // Persist user in our database
    await upsertUser({ 
      id: userId, 
      email: userEmail, 
      username: userUsername 
    });

    const sessionId = crypto.randomUUID();
    const maxAgeSec = 60 * 60 * 24 * 7; // 7 days
    const expiresAt = new Date(Date.now() + maxAgeSec * 1000);
    const ua = req.headers.get("user-agent");
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim();
    
    const created = await createSession({
      id: sessionId,
      userId: userId,
      userAgent: ua,
      ipAddress: ip || null,
      expiresAt,
    });

    const jwt = await createSessionJWT({ 
      sub: userId, 
      email: userEmail, 
      sessionId: created ? sessionId : undefined 
    });

    const res = new NextResponse(JSON.stringify({
      user: {
        id: userId,
        email: userEmail,
        username: userUsername,
      },
      userSub: cognitoResult.userSub,
      needsEmailVerification: cognitoResult.codeDeliveryDetails ? true : false,
    }), { 
      status: 201,
      headers: {
        "Content-Type": "application/json",
      }
    });

    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSec}`
    );
    
    return res;
  } catch (error) {
    console.error("Sign-up error:", error);
    if (error instanceof Error && error.message.includes("UsernameExistsException")) {
      return new NextResponse("User already exists", { status: 409 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

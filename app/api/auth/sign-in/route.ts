import { NextResponse } from "next/server";
import { createSessionJWT, COOKIE_NAME } from "@/lib/auth";
import { upsertUser, createSession } from "@/lib/db/repo";
import { cognitoSignIn, getCognitoUser } from "@/lib/cognito";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || typeof password !== "string") {
      return new NextResponse("Invalid body", { status: 400 });
    }

    // Authenticate with Cognito
    const cognitoResult = await cognitoSignIn(email, password);
    
    // Get user details from Cognito using the access token
    const cognitoUser = await getCognitoUser(cognitoResult.accessToken);
    if (!cognitoUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Ensure user exists in our database (sync with Cognito)
    await upsertUser({ 
      id: cognitoUser.id, 
      email: cognitoUser.email, 
      username: cognitoUser.username 
    });

    const sessionId = crypto.randomUUID();
    const maxAgeSec = 60 * 60 * 24 * 7; // 7 days
    const expiresAt = new Date(Date.now() + maxAgeSec * 1000);
    const ua = req.headers.get("user-agent");
    // Note: Depending on proxy, use x-forwarded-for; fall back to req headers
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "")
      .split(",")[0]
      .trim();
    
    const created = await createSession({
      id: sessionId,
      userId: cognitoUser.id,
      userAgent: ua,
      ipAddress: ip || null,
      expiresAt,
    });

    const jwt = await createSessionJWT({ 
      sub: cognitoUser.id, 
      email: cognitoUser.email, 
      sessionId: created ? sessionId : undefined 
    });

    const res = new NextResponse(JSON.stringify({
      user: {
        id: cognitoUser.id,
        email: cognitoUser.email,
        username: cognitoUser.username,
      },
      tokens: {
        accessToken: cognitoResult.accessToken,
        idToken: cognitoResult.idToken,
        // Note: We don't return refresh token for security
      }
    }), { 
      status: 200,
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
    console.error("Sign-in error:", error);
    
    // Return the specific error message from Cognito
    if (error instanceof Error) {
      return new NextResponse(
        JSON.stringify({ error: error.message }), 
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}

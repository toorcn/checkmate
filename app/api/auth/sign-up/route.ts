import { NextResponse } from "next/server";
import { cognitoSignUp } from "@/lib/cognito";

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || typeof password !== "string") {
      return new NextResponse(
        JSON.stringify({ error: "Invalid body" }), 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }

    // Create user in Cognito
    const cognitoResult = await cognitoSignUp(email, password, username);
    
    return new NextResponse(JSON.stringify({
      success: true,
      userSub: cognitoResult.userSub,
      needsEmailVerification: cognitoResult.codeDeliveryDetails ? true : false,
      codeDeliveryDetails: cognitoResult.codeDeliveryDetails,
    }), { 
      status: 201,
      headers: {
        "Content-Type": "application/json",
      }
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    
    // Return the specific error message from Cognito
    if (error instanceof Error) {
      return new NextResponse(
        JSON.stringify({ error: error.message }), 
        { 
          status: 400,
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

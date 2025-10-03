import { NextResponse } from "next/server";
import { cognitoConfirmSignUp } from "@/lib/cognito";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json().catch(() => ({}));
    
    if (typeof email !== "string" || typeof code !== "string") {
      return new NextResponse(
        JSON.stringify({ error: "Email and verification code are required" }), 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }

    // Confirm sign up with verification code
    await cognitoConfirmSignUp(email, code);

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: "Email verified successfully" 
      }), 
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    
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
      JSON.stringify({ error: "Email verification failed" }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}

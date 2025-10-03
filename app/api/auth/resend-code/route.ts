import { NextResponse } from "next/server";
import { cognitoResendConfirmationCode } from "@/lib/cognito";

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    
    if (typeof email !== "string") {
      return new NextResponse(
        JSON.stringify({ error: "Email is required" }), 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }

    // Resend verification code
    const result = await cognitoResendConfirmationCode(email);

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: "Verification code sent successfully",
        destination: result.destination 
      }), 
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  } catch (error) {
    console.error("Resend verification code error:", error);
    
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
      JSON.stringify({ error: "Failed to resend verification code" }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}

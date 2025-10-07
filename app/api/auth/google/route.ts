import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/cognito";

export async function GET(request: NextRequest) {
    try {
        const redirectUri = request.nextUrl.searchParams.get("redirect_uri") || 
                          `${request.nextUrl.origin}/api/auth/callback`;

        const authUrl = getGoogleOAuthUrl(redirectUri);

        return NextResponse.redirect(authUrl);
    } catch (error: any) {
        console.error("Error initiating Google OAuth:", error);
        return NextResponse.redirect(
            new URL(
                `/sign-in?error=${encodeURIComponent(error.message || "oauth_init_failed")}`,
                request.url
            )
        );
    }
}

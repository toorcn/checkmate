import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/cognito";

export async function GET(request: NextRequest) {
    try {
        // Get the correct origin (handle reverse proxy headers)
        const forwardedHost = request.headers.get('x-forwarded-host');
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
        
        const origin = forwardedHost
            ? `${forwardedProto}://${forwardedHost}`
            : request.nextUrl.origin;

        const redirectUri = request.nextUrl.searchParams.get("redirect_uri") || 
                          `${origin}/api/auth/callback`;

        console.log('🔍 Google OAuth origin detection:', {
            'nextUrl.origin': request.nextUrl.origin,
            'x-forwarded-host': request.headers.get('x-forwarded-host'),
            'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
            'finalOrigin': origin,
            'redirectUri': redirectUri
        });

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

import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode, getUserFromIdToken } from "@/lib/cognito";
import { cookies } from "next/headers";

// Helper function to get the correct origin
function getCorrectOrigin(request: NextRequest): string {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    
    return forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const origin = getCorrectOrigin(request);

        if (error) {
            console.error("OAuth error:", error);
            return NextResponse.redirect(
                new URL(`/sign-in?error=${encodeURIComponent(error)}`, origin)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL("/sign-in?error=missing_code", origin)
            );
        }

        const redirectUri = `${origin}/api/auth/callback`;

        console.log('🔍 Origin detection:', {
            'nextUrl.origin': request.nextUrl.origin,
            'x-forwarded-host': request.headers.get('x-forwarded-host'),
            'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
            'host': request.headers.get('host'),
            'finalOrigin': origin,
            'redirectUri': redirectUri
        });

        // Exchange code for tokens
        console.log('🔄 Starting token exchange...');
        const tokens = await exchangeOAuthCode(code, redirectUri);
        console.log('✅ Token exchange successful:', {
            hasAccessToken: !!tokens.accessToken,
            hasIdToken: !!tokens.idToken,
            hasRefreshToken: !!tokens.refreshToken,
            expiresIn: tokens.expiresIn
        });

        // Get user info from ID token (more reliable for OAuth)
        console.log('🔄 Getting user info from ID token...');
        const user = await getUserFromIdToken(tokens.idToken);
        console.log('✅ User info extracted:', {
            userId: user?.id,
            email: user?.email,
            username: user?.username,
            emailVerified: user?.emailVerified
        });

        if (!user) {
            return NextResponse.redirect(
                new URL("/sign-in?error=user_not_found", origin)
            );
        }

        // Set auth cookies
        const cookieStore = await cookies();
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
            maxAge: tokens.expiresIn,
        };

        cookieStore.set("accessToken", tokens.accessToken, cookieOptions);
        cookieStore.set("idToken", tokens.idToken, cookieOptions);
        cookieStore.set("refreshToken", tokens.refreshToken, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60, // 30 days for refresh token
        });

        // Set a flag to trigger auth refresh on the client
        cookieStore.set("oauth_login", "true", {
            httpOnly: false, // Client needs to read this
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
            maxAge: 10, // Short-lived, just for the redirect
        });

        // Redirect to home page using the correct origin
        const redirectUrl = new URL("/", origin);
        console.log('✅ OAuth callback completed successfully, redirecting to:', redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
    } catch (error: any) {
        console.error("❌ OAuth callback error:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        
        // Provide more specific error messages
        let errorMessage = "oauth_failed";
        if (error.message.includes("unauthorized_client")) {
            errorMessage = "callback_url_mismatch";
        } else if (error.message.includes("invalid_client")) {
            errorMessage = "client_config_error";
        } else if (error.message.includes("invalid_grant")) {
            errorMessage = "code_expired";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return NextResponse.redirect(
            new URL(
                `/sign-in?error=${encodeURIComponent(errorMessage)}`,
                getCorrectOrigin(request)
            )
        );
    }
}

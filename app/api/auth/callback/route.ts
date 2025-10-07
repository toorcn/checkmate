import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode, getUserFromIdToken } from "@/lib/cognito";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            console.error("OAuth error:", error);
            return NextResponse.redirect(
                new URL(`/sign-in?error=${encodeURIComponent(error)}`, request.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL("/sign-in?error=missing_code", request.url)
            );
        }

        // Exchange code for tokens
        const redirectUri = `${request.nextUrl.origin}/api/auth/callback`;
        const tokens = await exchangeOAuthCode(code, redirectUri);

        // Get user info from ID token (more reliable for OAuth)
        const user = await getUserFromIdToken(tokens.idToken);

        if (!user) {
            return NextResponse.redirect(
                new URL("/sign-in?error=user_not_found", request.url)
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

        // Redirect to home page
        return NextResponse.redirect(new URL("/", request.url));
    } catch (error: any) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(
            new URL(
                `/sign-in?error=${encodeURIComponent(error.message || "oauth_failed")}`,
                request.url
            )
        );
    }
}

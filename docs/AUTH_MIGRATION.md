# Auth Migration: Clerk → Amazon Cognito

This guide shows how to swap Clerk for Cognito while staying compatible with the DynamoDB schema and helpers added in `lib/dynamo/*`.

## Strategy

- Represent users generically by auth provider + subject.
  - DynamoDB GSI1 uses `AUTH#<provider>#<subject>` (provider is `clerk` or `cognito`).
- Keep Clerk in dev until Cognito is ready. Then flip provider and middleware.

## Data Model Changes (already applied)

- `UserItem` now has:
  - `authProvider: 'clerk' | 'cognito'`
  - `authSubject: string` (Clerk ID or Cognito `sub`)
  - Optional `clerkId` retained for compatibility
- GSI1 now keys by `AUTH#<provider>#<subject>` (works for both).

## Next.js Middleware Swap

- Remove Clerk middleware and add Cognito JWT verification.
- Minimal example:

```ts
// middleware.ts (Cognito)
import { NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const isPublic = (path: string) =>
  ["/", "/sign-in", "/sign-up", "/api/transcribe", "/api/analyze-tiktok"].some(
    (p) => path.startsWith(p)
  );

const jwks = createRemoteJWKSet(
  new URL(
    `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
  )
);

export async function middleware(req: Request) {
  const url = new URL(req.url);
  if (isPublic(url.pathname)) return NextResponse.next();

  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.cookies.get("id_token")?.value ||
    req.cookies.get("access_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/sign-in", url));

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      audience: process.env.COGNITO_CLIENT_ID,
    });
    // Attach auth to headers for API routes
    const res = NextResponse.next();
    res.headers.set("x-auth-provider", "cognito");
    res.headers.set("x-auth-subject", String(payload.sub));
    return res;
  } catch {
    return NextResponse.redirect(new URL("/sign-in", url));
  }
}

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

## Server Usage

- Read identity from headers set by middleware (or your auth util) and use `getUserByAuthSubject('cognito', sub)`.

```ts
import { getUserByAuthSubject } from "@/lib/dynamo/repo";

const user = await getUserByAuthSubject("cognito", cognitoSub);
```

## Environment

- Set:
  - `AWS_REGION`
  - `COGNITO_USER_POOL_ID`
  - `COGNITO_CLIENT_ID`
  - `COGNITO_CLIENT_SECRET` (if enabled)
  - `COGNITO_REGION` (same as `AWS_REGION`)
  - `COGNITO_DOMAIN` (e.g. `your-app.auth.us-east-1.amazoncognito.com`)
  - Optionally `AUTH_PROVIDER=cognito`

When using Better Auth with Cognito, ensure your Cognito App Client is configured with Authorization Code Grant and the callback URL includes `/api/auth/callback/cognito`.

## Rollback

- Keep the generic GSI1; switching back to Clerk only changes middleware and provider value.

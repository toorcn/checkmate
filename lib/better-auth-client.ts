"use client";

export async function signInEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    // Try to parse as JSON first
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      throw new Error(data.error || "Sign-in failed");
    } else {
      const text = await res.text();
      throw new Error(text || "Sign-in failed");
    }
  }
}

export async function signUpEmailPassword(input: {
  email: string;
  password: string;
}): Promise<void> {
  const res = await fetch("/api/auth/sign-up", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    // Try to parse as JSON first
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      throw new Error(data.error || "Sign-up failed");
    } else {
      const text = await res.text();
      throw new Error(text || "Sign-up failed");
    }
  }
}

export async function verifyEmail(input: {
  email: string;
  code: string;
}): Promise<void> {
  const res = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      throw new Error(data.error || "Email verification failed");
    } else {
      const text = await res.text();
      throw new Error(text || "Email verification failed");
    }
  }
}

export async function resendVerificationCode(email: string): Promise<void> {
  const res = await fetch("/api/auth/resend-code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      throw new Error(data.error || "Failed to resend verification code");
    } else {
      const text = await res.text();
      throw new Error(text || "Failed to resend verification code");
    }
  }
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
}

export function signInWithGoogle(): void {
  const redirectUri = `${window.location.origin}/api/auth/callback`;
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
  });
  
  // Redirect to our API endpoint which will generate the Cognito URL
  window.location.href = `/api/auth/google?${params}`;
}
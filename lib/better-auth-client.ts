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
    const text = await res.text();
    throw new Error(text || "Sign-in failed");
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
    const text = await res.text();
    throw new Error(text || "Sign-up failed");
  }
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST" });
}

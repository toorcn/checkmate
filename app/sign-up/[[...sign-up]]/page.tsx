"use client";

import { SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { signUpEmailPassword, verifyEmail, resendVerificationCode, signInEmailPassword } from "@/lib/better-auth-client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [needsVerification, setNeedsVerification] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signUpEmailPassword({ email, password });
      setNeedsVerification(true);
      setSuccessMessage("Account created! Please check your email for a verification code.");
    } catch (err: any) {
      setError(err?.message || "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      await verifyEmail({ email, code: verificationCode });

      await signInEmailPassword({email, password})
      setSuccessMessage("Email verified successfully! Logging you in...");
      setTimeout(() => {
        router.replace("/");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to verify email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendCode = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      await resendVerificationCode(email);
      setSuccessMessage("Verification code sent! Please check your email.");
    } catch (err: any) {
      setError(err?.message || "Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <SearchCheck className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Checkmate</span>
        </div>
        <Card className="p-6 shadow-sm border">
          {!needsVerification ? (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-semibold tracking-tight">
                  Create your account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Start verifying content in minutes
                </p>
              </div>
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {error ? (
                  <div className="text-destructive text-sm" role="alert">
                    {error}
                  </div>
                ) : null}
                {successMessage ? (
                  <div className="text-green-600 text-sm" role="status">
                    {successMessage}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Creating..." : "Create account"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-semibold tracking-tight">
                  Verify your email
                </h1>
                <p className="text-sm text-muted-foreground">
                  We sent a verification code to {email}
                </p>
              </div>
              <form onSubmit={onVerify} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    placeholder="Enter 6-digit code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    maxLength={6}
                    autoComplete="off"
                  />
                </div>
                {error ? (
                  <div className="text-destructive text-sm" role="alert">
                    {error}
                  </div>
                ) : null}
                {successMessage ? (
                  <div className="text-green-600 text-sm" role="status">
                    {successMessage}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Verifying..." : "Verify Email"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onResendCode}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Resend Code
                </Button>
              </form>
            </>
          )}
          <div className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-foreground underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

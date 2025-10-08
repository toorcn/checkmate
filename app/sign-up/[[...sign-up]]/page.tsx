"use client";

import { SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { signUpEmailPassword, verifyEmail, resendVerificationCode, signInEmailPassword, signInWithGoogle } from "@/lib/better-auth-client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";

export default function Page() {
  const router = useRouter();
  const { refreshUser } = useAuth();
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
      await refreshUser(); // Refresh auth state immediately
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

  const handleGoogleSignIn = () => {
    setError(null);
    signInWithGoogle();
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </Button>
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

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { TextBlockSkeleton } from "@/components/feedback/Skeletons";
import { AuthCard } from "@/components/auth/LoginCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { bodyStyles, displayStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

function ResetPasswordPageContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError("Invalid or expired reset link. Please request a new password reset.");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch {
        setError("Failed to validate reset link.");
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <AuthCard>
        <h1 className="sr-only">Reset your password</h1>
        <TextBlockSkeleton heading lines={4} label="Validating reset link..." />
      </AuthCard>
    );
  }

  if (!tokenValid) {
    return (
      <AuthCard>
        <div className="text-center">
          <h1 className={cn(displayStyles.sm, "mb-3 text-text-primary")}>Invalid Reset Link</h1>
          <Alert variant="destructive" className="mb-6 text-left">
            <AlertDescription>{error || "This password reset link is invalid or has expired."}</AlertDescription>
          </Alert>
          <Link href="/login" replace className={buttonVariants()}>
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard>
        <div className="text-center" role="status" aria-live="polite">
          <h1 className={cn(displayStyles.sm, "mb-2 text-text-primary")}>Password Reset Successful!</h1>
          <p className={cn(bodyStyles.md, "text-text-muted")}>Your password has been updated. Redirecting to login page...</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h1 className={cn(displayStyles.sm, "mb-2 text-text-primary")}>Reset Your Password</h1>
        <p className={cn(bodyStyles.md, "text-text-muted")}>Enter your new password below</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="new-password">New Password</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-new-password">Confirm New Password</FieldLabel>
          <Input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Re-enter your password"
          />
        </Field>
        <Button type="submit" disabled={isLoading} className="h-10 w-full">
          {isLoading ? "Resetting password..." : "Reset password"}
        </Button>
        <div className="text-center">
          <Link href="/login" replace className={cn(bodyStyles.md, "rounded-sm text-accent-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
            Back to login
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <TextBlockSkeleton heading lines={4} />
        </AuthCard>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}

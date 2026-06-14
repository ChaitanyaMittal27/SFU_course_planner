"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { XCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { displayStyles, bodyStyles, labelStyles, headerStyles } from "@/app/fonts";

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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
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
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3">
        <LoadingSpinner />
        <p className={`${bodyStyles.md} text-text-muted`}>Validating reset link...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CardContent className="p-0">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className={`${headerStyles.lg} text-text-primary mb-2`}>Invalid Reset Link</h2>
            <p className={`${bodyStyles.md} text-text-muted mb-6`}>
              {error || "This password reset link is invalid or has expired."}
            </p>
            <Button onClick={() => router.push("/login")}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CardContent className="p-0">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className={`${headerStyles.lg} text-text-primary mb-2`}>Password Reset Successful!</h2>
            <p className={`${bodyStyles.md} text-text-muted`}>
              Your password has been updated. Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="p-8 max-w-md w-full">
        <CardContent className="p-0">
          <div className="text-center mb-6">
            <h1 className={`${displayStyles.sm} text-text-primary mb-2`}>Reset Your Password</h1>
            <p className={`${bodyStyles.md} text-text-muted`}>Enter your new password below</p>
          </div>

          {error && (
            <div className={`mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded ${bodyStyles.md} text-destructive`}>
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={`${labelStyles.lg} text-text-primary block mb-1`}>New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className={`${labelStyles.lg} text-text-primary block mb-1`}>Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" onClick={() => router.push("/login")} className="text-accent">
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

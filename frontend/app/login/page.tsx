"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { displayStyles, bodyStyles, labelStyles, headerStyles } from "@/app/fonts";
import { buildAuthCallbackUrl, resolveAuthRedirect } from "@/lib/auth/redirect";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const oauthProviders = {
  google: { label: "Google", scopes: undefined },
  azure: { label: "Microsoft", scopes: "email" },
} as const;

type OAuthProvider = keyof typeof oauthProviders;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") setActiveTab("signup");

    if (searchParams.get("error") === "oauth_callback_failed") {
      setError("We couldn't complete sign in. Please try again.");
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(resolveAuthRedirect(searchParams.get("redirectTo")));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to sign in"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(window.location.origin, searchParams.get("redirectTo")),
        },
      });
      if (error) throw error;

      if (data.session) {
        try {
          await api.initializePreferencesOnSignup(email);
        } catch {
          console.warn("Failed to initialize preferences after signup");
        }
        router.replace(resolveAuthRedirect(searchParams.get("redirectTo")));
        return;
      }

      setSuccessMessage("Account created! Please check your email to verify your account.");
      // reset form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create account"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setError(null);
    setIsLoading(true);

    const providerConfig = oauthProviders[provider];

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildAuthCallbackUrl(window.location.origin, searchParams.get("redirectTo")),
          ...(providerConfig.scopes ? { scopes: providerConfig.scopes } : {}),
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(getErrorMessage(err, `Failed to sign in with ${providerConfig.label}`));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotSuccess(false);
        setForgotEmail("");
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reset email"));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
      <Card className="p-5 sm:p-8 max-w-md w-full">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`${displayStyles.sm} text-text-primary mb-2`}>Welcome to SFU Course Planner</h1>
            <p className={`${bodyStyles.md} text-text-muted`}>Sign in to manage your course bookmarks</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6" role="tablist" aria-label="Account actions">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                id={`${tab}-tab`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 ${labelStyles.lg} border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className={`mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded ${bodyStyles.md} text-destructive`}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className={`mb-4 p-3 bg-success/10 border border-success/30 rounded ${bodyStyles.md} text-success`} role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <form id="signin-panel" role="tabpanel" aria-labelledby="signin-tab" onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className={`${labelStyles.lg} text-text-primary block mb-1`}>Email</label>
                <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="signin-password" className={`${labelStyles.lg} text-text-primary block mb-1`}>Password</label>
                <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-accent p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <form id="signup-panel" role="tabpanel" aria-labelledby="signup-tab" onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className={`${labelStyles.lg} text-text-primary block mb-1`}>Email</label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="signup-password" className={`${labelStyles.lg} text-text-primary block mb-1`}>Password</label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="signup-confirm-password" className={`${labelStyles.lg} text-text-primary block mb-1`}>Confirm Password</label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-2 bg-background ${bodyStyles.md} text-text-subtle`}>Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" onClick={() => handleOAuthSignIn("google")} disabled={isLoading} className="w-full gap-2">
              <Image src="/auth/google.svg" alt="" width={20} height={20} aria-hidden="true" />
              <span className={`${labelStyles.lg} text-text-primary`}>Sign in with Google</span>
            </Button>
            {/* comment out microsoft login for now since we don't have it sfu permissions yet
            <Button variant="outline" onClick={() => handleOAuthSignIn("azure")} disabled={isLoading} className="w-full gap-2">
              <Image src="/auth/microsoft.svg" alt="" width={20} height={20} aria-hidden="true" />
              <span className={`${labelStyles.lg} text-text-primary`}>Sign in with Microsoft</span>
            </Button>
            */}
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center px-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <CardContent className="p-0" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title" aria-describedby="forgot-password-description">
              {!forgotSuccess ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 id="forgot-password-title" className={`${headerStyles.lg} text-text-primary mb-2`}>Reset Password</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Close reset password dialog"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail("");
                      }}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p id="forgot-password-description" className={`${bodyStyles.md} text-text-muted mb-4`}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-password-email" className={`${labelStyles.lg} text-text-primary block mb-1`}>Email</label>
                      <Input
                        id="forgot-password-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotEmail("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={forgotLoading} className="flex-1">
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center" role="status" aria-live="polite">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" aria-hidden="true" />
                  </div>
                  <h3 className={`${headerStyles.md} text-text-primary mb-2`}>Email Sent!</h3>
                  <p className={`${bodyStyles.md} text-text-muted`}>Check your email for the password reset link.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  );
}

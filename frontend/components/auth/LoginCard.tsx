"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { buildAuthCallbackUrl, resolveAuthRedirect } from "@/lib/auth/redirect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bodyStyles, displayStyles, headerStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const oauthProviders = {
  google: { label: "Google", scopes: undefined, logo: "/auth/google.svg" },
  azure: { label: "Microsoft", scopes: "email", logo: "/auth/microsoft.svg" },
} as const;

type OAuthProvider = keyof typeof oauthProviders;
type Tab = "signin" | "signup";

/** Centred card for auth pages (sign in, reset password). */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[26.25rem] rounded-lg border border-border bg-surface p-6 sm:p-8">{children}</div>
    </div>
  );
}

interface LoginCardProps {
  /** Show "Continue with Microsoft" (Azure OAuth). Off until SFU's Azure setup is done. */
  showMicrosoft: boolean;
}

export default function LoginCard({ showMicrosoft }: LoginCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(() => (searchParams.get("tab") === "signup" ? "signup" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("error") === "oauth_callback_failed" ? "We couldn't complete sign in. Please try again." : null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeForgotPassword = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowForgotPassword(false);
    setForgotSuccess(false);
    setForgotEmail("");
  };

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
      closeTimer.current = setTimeout(closeForgotPassword, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reset email"));
    } finally {
      setForgotLoading(false);
    }
  };

  const providers: OAuthProvider[] = showMicrosoft ? ["google", "azure"] : ["google"];

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h1 className={cn(displayStyles.sm, "mb-2 text-text-primary")}>Welcome to SFU Course Planner</h1>
        <p className={cn(bodyStyles.md, "text-text-muted")}>Sign in to manage your course bookmarks</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as Tab);
          setError(null);
          setSuccessMessage(null);
        }}
        className="gap-5"
      >
        <TabsList aria-label="Account actions" className="w-full bg-surface-raised">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>

        <div className="space-y-3">
          {providers.map((provider) => (
            <Button key={provider} variant="outline" onClick={() => handleOAuthSignIn(provider)} disabled={isLoading} className="h-10 w-full gap-2">
              <Image src={oauthProviders[provider].logo} alt="" width={18} height={18} aria-hidden="true" />
              Continue with {oauthProviders[provider].label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3" role="presentation">
          <Separator className="flex-1" />
          <span className={cn(bodyStyles.sm, "text-text-subtle")}>or with email</span>
          <Separator className="flex-1" />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-text-primary">{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert role="status" aria-live="polite" className="border-success/30 bg-success-tint">
            <AlertDescription className="text-success-text">{successMessage}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="signin-email">Email</FieldLabel>
              <Input id="signin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field>
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor="signin-password">Password</FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className={cn(bodyStyles.sm, "rounded-sm text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                >
                  Forgot password?
                </button>
              </div>
              <Input id="signin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={isLoading} className="h-10 w-full">
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
              <Input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <Button type="submit" disabled={isLoading} className="h-10 w-full">
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <Dialog open={showForgotPassword} onOpenChange={(open) => (open ? setShowForgotPassword(true) : closeForgotPassword())}>
        <DialogContent className="sm:max-w-md">
          {!forgotSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className={headerStyles.lg}>Reset Password</DialogTitle>
                <DialogDescription>Enter your email address and we&apos;ll send you a link to reset your password.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                  <Input id="forgot-password-email" type="email" autoComplete="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                </Field>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeForgotPassword}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={forgotLoading}>
                    {forgotLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <div role="status" aria-live="polite" className="py-2 text-center">
              <DialogTitle className={cn(headerStyles.md, "mb-2")}>Email Sent!</DialogTitle>
              <p className={cn(bodyStyles.md, "text-text-muted")}>Check your email for the password reset link.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AuthCard>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { bodyStyles, headerStyles } from "@/app/fonts";

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        if (!code) {
          router.push("/");
          return;
        }
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("OAuth exchange error:", exchangeError);
          setError(exchangeError.message || "Failed to complete sign in");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }
        router.push(searchParams.get("redirectTo") || "/dashboard");
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError(err.message || "Failed to complete sign in");
        setTimeout(() => router.push("/login"), 3000);
      }
    };
    handleCallback();
  }, [searchParams, router]);

  if (!error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <LoadingSpinner />
        <p className={`${bodyStyles.md} text-text-muted`}>Completing sign in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Card className="p-8 max-w-md w-full text-center">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className={`${headerStyles.lg} text-text-primary mb-2`}>Sign In Failed</h2>
          <p className={`${bodyStyles.md} text-text-muted mb-2`}>{error}</p>
          <p className={`${bodyStyles.sm} text-text-subtle`}>Redirecting back to login...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}

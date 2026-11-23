"use client";

import { Suspense } from "react";
import LoginCard, { AuthCard } from "@/components/auth/LoginCard";
import { TextBlockSkeleton } from "@/components/feedback/Skeletons";

// Enable once SFU's Azure (Microsoft) OAuth setup is done. The button uses the same
// signInWithOAuth("azure") path and callback as Google.
const SHOW_MICROSOFT_LOGIN = false;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <TextBlockSkeleton heading lines={4} />
        </AuthCard>
      }
    >
      <LoginCard showMicrosoft={SHOW_MICROSOFT_LOGIN} />
    </Suspense>
  );
}

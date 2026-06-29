"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  AuthPageShell,
  clerkDarkAppearance,
} from "@/components/auth/AuthMarketingPanel";

export default function LoginPage() {
  const { isSignedIn } = useAuth();
  const redirectUrl =
    typeof window === "undefined"
      ? "/dashboard"
      : new URLSearchParams(window.location.search).get("redirect_url") ||
        "/dashboard";

  return (
    <AuthPageShell>
      <div className="mb-8 text-center lg:text-left">
        <h2 className="mb-2 text-[28px] font-semibold tracking-[-0.01em] text-[#e0e2ed]">
          Welcome back
        </h2>
        <p className="text-[16px] text-[#e0e2ed]">
          Sign in with Clerk to continue to MoneySignal AI.
        </p>
      </div>

      <div className="flex justify-center">
        {isSignedIn ? (
          <Link
            href={redirectUrl}
            className="w-full rounded bg-[#adc6ff] py-3 text-center text-[16px] font-semibold text-[#002e6a] shadow-lg shadow-[#adc6ff]/10 transition-all hover:bg-[#d8e2ff]"
          >
            Continue to MoneySignal AI
          </Link>
        ) : (
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl="/dashboard"
            appearance={clerkDarkAppearance}
          />
        )}
      </div>
    </AuthPageShell>
  );
}

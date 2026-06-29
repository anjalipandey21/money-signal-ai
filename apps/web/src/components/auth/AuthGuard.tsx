"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#10131b] text-[#e0e2ed]">
        <div className="rounded border border-[#424754] bg-[#0d121f] px-6 py-4 shadow-2xl">
          <p className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getAuthSession } from "@/lib/authSession";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setAllowed(true);
    setIsChecking(false);
  }, [pathname, router]);

  if (isChecking) {
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

  if (!allowed) return null;

  return <>{children}</>;
}
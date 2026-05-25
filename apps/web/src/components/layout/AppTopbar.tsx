"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { clearAuthSession, getAuthSession, type AuthSession } from "@/lib/authSession";

export function AppTopbar() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setSession(getAuthSession());
  }, []);

  function handleLogout() {
    clearAuthSession();
    setIsProfileOpen(false);
    router.replace("/login");
  }

  const userName = session?.user.name || "BD Analyst";
  const userEmail = session?.user.email || "analyst@moneysignal.ai";
  const userRole = session?.user.role || "Institutional";

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#424754]/40 bg-[#10131b]/95 backdrop-blur md:left-[240px]">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded border border-[#424754]/50 bg-[#181c23] px-3 py-1.5 md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6]">
              Live Market Feed
            </span>
          </div>

          <div className="relative hidden w-[360px] md:block">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8c909f]"
            />
            <input
              type="text"
              placeholder="Search tickers, funds, or signals..."
              className="w-full rounded border border-[#424754]/50 bg-[#181c23] py-2 pl-10 pr-4 text-[13px] text-[#e0e2ed] outline-none placeholder:text-[#8c909f] transition-all focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff]/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded border border-[#424754]/50 bg-[#181c23] text-[#c2c6d6] transition-colors hover:border-[#adc6ff]/50 hover:text-[#adc6ff]">
            <MaterialIcon name="notifications" className="text-[20px]" />
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded border border-[#424754]/50 bg-[#181c23] text-[#c2c6d6] transition-colors hover:border-[#adc6ff]/50 hover:text-[#adc6ff]">
            <MaterialIcon name="settings" className="text-[20px]" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded border border-[#424754]/50 bg-[#181c23] px-3 py-1.5 transition-colors hover:border-[#adc6ff]/50"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#adc6ff] text-[12px] font-bold text-[#002e6a]">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden text-left md:block">
                <p className="text-[13px] font-medium leading-4 text-[#e0e2ed]">
                  {userName}
                </p>
                <p className="text-[11px] leading-4 text-[#c2c6d6]">
                  {userRole}
                </p>
              </div>

              <MaterialIcon
                name={isProfileOpen ? "expand_less" : "expand_more"}
                className="text-[18px] text-[#c2c6d6]"
              />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 mt-2 w-[260px] overflow-hidden rounded border border-[#424754]/70 bg-[#0d121f] shadow-2xl">
                <div className="border-b border-[#424754]/40 p-4">
                  <p className="text-[14px] font-semibold text-[#e0e2ed]">
                    {userName}
                  </p>
                  <p className="mt-1 text-[12px] text-[#c2c6d6]">
                    {userEmail}
                  </p>
                  <p className="mt-2 inline-flex rounded border border-[#4edea3]/30 bg-[#4edea3]/10 px-2 py-0.5 font-mono text-[10px] uppercase text-[#4edea3]">
                    {userRole}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-[#c2c6d6] transition-colors hover:bg-[#181c23] hover:text-[#e0e2ed]"
                >
                  <MaterialIcon name="person" className="text-[18px]" />
                  Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-[#c2c6d6] transition-colors hover:bg-[#181c23] hover:text-[#e0e2ed]"
                >
                  <MaterialIcon name="tune" className="text-[18px]" />
                  Preferences
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t border-[#424754]/40 px-4 py-3 text-left text-[13px] text-[#ffb4ab] transition-colors hover:bg-[#93000a]/10"
                >
                  <MaterialIcon name="logout" className="text-[18px]" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
import type { ReactNode } from "react";
import { AppFooter } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { AuthGuard } from "@/components/auth/AuthGuard";

type AppShellProps = {
  activePage:
    | "Dashboard"
    | "Signals Feed"
    | "Stocks"
    | "Funds"
    | "Insider Trades"
    | "Watchlist"
    | "Alerts"
    | "Methodology"
    | "Settings"
    | "Support";
  children: ReactNode;
};

export function AppShell({ activePage, children }: AppShellProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen overflow-x-auto bg-[#10131b] text-[#e0e2ed]">
        <AppSidebar activePage={activePage} />
        <AppTopbar />

        <main className="min-w-[1040px] flex-1 overflow-x-hidden p-4 pt-20 md:ml-[240px] md:p-6 md:pt-[88px]">
          <div className="mx-auto max-w-[1440px] space-y-6">{children}</div>
        </main>

        <AppFooter />
      </div>
    </AuthGuard>
  );
}


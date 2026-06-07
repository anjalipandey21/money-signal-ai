"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ActionBadge } from "@/components/ui/ActionBadge";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { TopMoneySignalScores } from "@/components/dashboard/TopMoneySignalScores";
import { RecentInstitutionalMoves } from "@/components/dashboard/RecentInstitutionalMoves";
import { RecentInsiderTrades } from "@/components/dashboard/RecentInsiderTrades";
import { DashboardAIMarketPulse } from "@/components/dashboard/DashboardAIMarketPulse";
import { DashboardWatchlistPreview } from "@/components/dashboard/DashboardWatchlistPreview";
import { DashboardDataHealthCard } from "@/components/dashboard/DashboardDataHealthCard";
import { DashboardMarketRefreshCard } from "@/components/dashboard/DashboardMarketRefreshCard";
import { useEffect, useState } from "react";

function AIAssistantButton() {
  return (
    <button className="flex w-full items-center justify-between rounded-[2px] border border-[#424754]/30 bg-[#181c23]/80 p-4 transition hover:border-[#adc6ff]">
      <div className="flex items-center gap-3">
        <MaterialIcon name="smart_toy" className="text-[24px] text-[#ddb7ff]" />
        <div className="text-left">
          <span className="block text-[12px] font-bold text-[#e0e2ed]">
            AI Assistant
          </span>
          <span className="block font-mono text-[10px] uppercase text-[#c2c6d6]">
            Institutional Support
          </span>
        </div>
      </div>

      <MaterialIcon name="arrow_forward" className="text-[22px] text-[#c2c6d6]" />
    </button>
  );
}

export default function DashboardPage() {
  return (
    <AppShell activePage="Dashboard">

      <TopMoneySignalScores />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <RecentInstitutionalMoves />
          <RecentInsiderTrades />
          <DashboardWatchlistPreview />
        </div>

        <div className="flex flex-col gap-6">
          <DashboardMarketRefreshCard />
          <DashboardDataHealthCard />
          <DashboardAIMarketPulse />
          <AIAssistantButton />
        </div>
      </div>
    </AppShell>
  );
}
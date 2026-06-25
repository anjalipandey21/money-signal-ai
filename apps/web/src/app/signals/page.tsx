"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SignalsFeedList } from "@/components/signals/SignalsFeedList";
import type { SignalDirectionFilter } from "@/lib/moneySignalApi";

type FilterButtonProps = {
  children: React.ReactNode;
  icon?: string;
  onClick?: () => void;
};
function FilterButton({ children, icon, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-[#424754]/50 bg-[#181c23] px-3 py-1.5 font-mono text-[12px] text-[#e0e2ed] transition-all hover:border-[#8c909f] hover:bg-[#1c2027]"
    >
      {icon ? <MaterialIcon name={icon} className="text-[16px]" /> : null}

      {children}

      <MaterialIcon
        name="arrow_drop_down"
        className="text-[16px] text-[#8c909f]"
      />
    </button>
  );
}

export default function SignalsPage() {
  const [direction, setDirection] = useState<SignalDirectionFilter>("all");

  return (
    <AppShell activePage="Signals Feed">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-[#e0e2ed]">
              Real-time Signals
            </h1>

            <p className="text-[14px] leading-5 text-[#c2c6d6]">
              Latest public money-movement signals from tracked companies and
              funds.
            </p>

            <p className="mt-2 text-[13px] text-[#8c909f]">
              Filter by signal direction to review confidence, source, and AI
              context.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterButton icon="filter_list" onClick={() => setDirection("all")}>
              All Signals
            </FilterButton>

            <FilterButton onClick={() => setDirection("bullish")}>
              Bullish
            </FilterButton>

            <FilterButton onClick={() => setDirection("bearish")}>
              Bearish
            </FilterButton>

            <FilterButton onClick={() => setDirection("mixed")}>
              Mixed
            </FilterButton>

            <button
              type="button"
              onClick={() => setDirection("all")}
              className="rounded-full border border-[#424754]/50 bg-[#181c23] p-1.5 text-[#c2c6d6] transition-all hover:border-[#adc6ff]/50 hover:text-[#adc6ff]"
            >
              <MaterialIcon name="refresh" className="text-[18px]" />
            </button>
          </div>
        </section>

        <SignalsFeedList direction={direction} />
      </div>
    </AppShell>
  );
}

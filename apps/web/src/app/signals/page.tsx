import { AppShell } from "@/components/layout/AppShell";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SignalsFeedList } from "@/components/signals/SignalsFeedList";

export default function SignalsPage() {
  return (
    <AppShell activePage="Signals Feed">
      <section className="rounded-xl border border-[#424754]/50 bg-[#0d121f] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <MaterialIcon name="analytics" className="text-[24px] text-[#adc6ff]" />
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#e0e2ed]">
                Signals Feed
              </h1>
            </div>

            <p className="max-w-3xl text-[14px] leading-6 text-[#c2c6d6]">
              Monitor smart-money movements, insider activity, institutional filing
              changes, and AI-ranked market signals in one research feed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded border border-[#424754]/60 bg-[#181c23] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6] hover:border-[#adc6ff]/60 hover:text-[#adc6ff]">
              All Sources
            </button>

            <button className="rounded border border-[#424754]/60 bg-[#181c23] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6] hover:border-[#adc6ff]/60 hover:text-[#adc6ff]">
              Bullish
            </button>

            <button className="rounded border border-[#424754]/60 bg-[#181c23] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[#c2c6d6] hover:border-[#adc6ff]/60 hover:text-[#adc6ff]">
              Mixed
            </button>
          </div>
        </div>
      </section>

      <SignalsFeedList />
    </AppShell>
  );
}
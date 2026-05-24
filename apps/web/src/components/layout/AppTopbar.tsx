import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function AppTopbar() {
  return (
    <nav className="fixed right-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#424754] bg-[#10131b] px-4 md:w-[calc(100%-240px)]">
      <div className="flex w-full max-w-2xl items-center gap-4">
        <div className="relative w-full">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#c2c6d6]"
          />

          <input
            className="h-10 w-full rounded-[2px] border border-[#424754] bg-[#181c23] py-2 pl-10 pr-4 text-[13px] text-[#e0e2ed] outline-none placeholder:text-[#c2c6d6]/50 focus:border-[#adc6ff]"
            placeholder="Search tickers, funds, insiders, or signals..."
            type="text"
          />
        </div>
      </div>

      <div className="hidden items-center gap-6 md:flex">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#4edea3]">
          <span className="h-2 w-2 rounded-full bg-[#4edea3]" />
          LIVE MARKET FEED
        </div>

        <div className="flex items-center gap-4 text-[#c2c6d6]">
          <button className="relative transition hover:text-[#adc6ff]">
            <MaterialIcon name="notifications" className="text-[24px]" />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#ffb4ab]" />
          </button>

          <button className="transition hover:text-[#adc6ff]">
            <MaterialIcon name="settings" className="text-[24px]" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-[#424754] pl-4">
          <div className="text-right">
            <div className="text-[14px] font-medium text-[#e0e2ed]">
              BD Analyst
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#c2c6d6]">
              Institutional
            </div>
          </div>

          <div className="h-8 w-8 rounded-full border border-[#424754] bg-[#181c23]" />
        </div>
      </div>
    </nav>
  );
}
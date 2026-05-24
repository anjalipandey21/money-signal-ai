import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="relative z-30 mt-auto flex w-full flex-col items-center justify-between gap-2 border-t border-[#424754] bg-[#0a0e16] px-4 py-4 text-[#c2c6d6] md:ml-[240px] md:w-[calc(100%-240px)] md:flex-row">
      <div className="flex items-center gap-2 font-mono text-[12px] uppercase">
        <span>ⓘ</span>
        <span>© 2024 MoneySignal AI. Institutional Intelligence.</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider">
        <span>Research intelligence only. Not financial advice.</span>
        <span className="hidden text-[#424754] md:inline">|</span>
        <Link href="#" className="hover:text-[#adc6ff]">
          Privacy Policy
        </Link>
        <span className="hidden text-[#424754] md:inline">|</span>
        <Link href="#" className="hover:text-[#adc6ff]">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
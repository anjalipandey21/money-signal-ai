import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type ActivePage =
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

type AppSidebarProps = {
  activePage: ActivePage;
};

const mainNavItems: { label: ActivePage; href: string; icon: string }[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Signals Feed", href: "/signals", icon: "analytics" },
  { label: "Stocks", href: "/stocks/NVDA", icon: "show_chart" },
  { label: "Funds", href: "/funds", icon: "account_balance" },
  { label: "Insider Trades", href: "/insiders", icon: "person_search" },
  { label: "Watchlist", href: "/watchlist", icon: "star" },
  { label: "Alerts", href: "/alerts", icon: "notifications" },
];

const comingSoonItems = [
  { label: "Congressional Trades", icon: "policy" },
  { label: "Activist Signals", icon: "campaign" },
  { label: "Buybacks", icon: "settings_backup_restore" },
];

const bottomItems: { label: ActivePage; href: string; icon: string }[] = [
  { label: "Support", href: "/support", icon: "help" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

function SidebarLink({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex h-12 items-center gap-3 px-4 text-[14px] transition-colors ${
        active
          ? "border-r-2 border-[#adc6ff] bg-[#4d8eff]/10 font-medium text-[#adc6ff]"
          : "text-[#c2c6d6] hover:bg-[#262a32] hover:text-[#e0e2ed]"
      }`}
    >
      <MaterialIcon name={icon} fill={active} className="text-[24px]" />

      <span>{label}</span>

      {badge ? (
        <span className="ml-auto rounded bg-[#4d8eff] px-1.5 py-0.5 text-[10px] font-bold text-[#00285d]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function DisabledSidebarItem({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="flex h-11 cursor-not-allowed items-center gap-3 px-4 text-[13px] text-[#c2c6d6]/40">
      <MaterialIcon name={icon} className="text-[22px]" />
      <span>{label}</span>
    </div>
  );
}

export function AppSidebar({ activePage }: AppSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[240px] flex-col border-r border-[#424754] bg-[#10131b] md:flex">
      {/* Brand */}
      <div className="border-b border-[#424754]/30 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#4d8eff]/20 text-[#adc6ff]">
            <MaterialIcon name="analytics" className="text-[20px]" />
          </div>

          <div>
            <h1 className="text-[18px] font-semibold leading-5 tracking-[-0.02em] text-[#adc6ff]">
              MoneySignal AI
            </h1>
            <p className="mt-0.5 font-mono text-[10px] uppercase leading-4 tracking-[0.18em] text-[#c2c6d6]">
              Institutional Grade
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar body */}
      <nav className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Main Navigation */}
        <div className="flex flex-col py-4">
          {mainNavItems.map((item) => (
            <SidebarLink
              key={item.label}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={activePage === item.label}
              badge={item.label === "Alerts" ? "3" : undefined}
            />
          ))}
        </div>

        {/* This creates the professional Stitch-style breathing space */}
        <div className="min-h-[120px] flex-1" />

        {/* Coming Soon */}
        <div className="border-t border-[#424754]/30 py-3">
          <p className="px-4 pb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#c2c6d6]/50">
            Coming Soon
          </p>

          <div className="flex flex-col">
            {comingSoonItems.map((item) => (
              <DisabledSidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>
        </div>

        {/* Bottom Links */}
        <div className="border-t border-[#424754]/30 py-2">
          {bottomItems.map((item) => (
            <SidebarLink
              key={item.label}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={activePage === item.label}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
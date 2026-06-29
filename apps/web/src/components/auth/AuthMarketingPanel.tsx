"use client";

import type { ClerkAppearanceTheme } from "@clerk/shared/types";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const signalRows = [
  {
    ticker: "NVDA",
    score: "92",
    label: "BULLISH",
    tone: "text-[#4edea3]",
  },
  {
    ticker: "PLTR",
    score: "88",
    label: "ACCUMULATE",
    tone: "text-[#4edea3]",
  },
  {
    ticker: "TSLA",
    score: "45",
    label: "REDUCE",
    tone: "text-[#ffb4ab]",
  },
];

export const clerkDarkAppearance: ClerkAppearanceTheme = {
  variables: {
    colorBackground: "#0d121f",
    colorPrimary: "#adc6ff",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card:
      "w-full border border-[#424754] bg-[#181c23] text-[#e0e2ed] shadow-none",
    main: "text-[#e0e2ed]",
    header: "text-[#e0e2ed]",
    headerTitle: "!text-[#f8fafc]",
    headerSubtitle: "!text-[#c2c6d6]",
    socialButtonsBlockButton:
      "border-[#424754] bg-[#0d121f] !text-[#e0e2ed] hover:border-[#adc6ff] hover:bg-[#262a32]",
    socialButtonsBlockButtonText: "!text-[#e0e2ed]",
    dividerLine: "bg-[#424754]",
    dividerText: "!text-[#c2c6d6]",
    formFieldLabel:
      "font-mono text-[11px] uppercase tracking-wider !text-[#c2c6d6]",
    formFieldInput:
      "border-[#cbd5e1] !bg-white !text-[#111827] caret-[#111827] placeholder:!text-[#64748b] focus:border-[#adc6ff] focus:ring-[#adc6ff]",
    formFieldInputShowPasswordButton: "!text-[#334155] hover:!text-[#0f172a]",
    formButtonPrimary:
      "bg-[#adc6ff] font-semibold !text-[#002e6a] shadow-lg shadow-[#adc6ff]/10 hover:bg-[#d8e2ff]",
    footerActionText: "!text-[#c2c6d6]",
    footerActionLink: "font-semibold !text-[#adc6ff] hover:!text-[#d8e2ff]",
    identityPreview: "border-[#424754] bg-[#0d121f]",
    identityPreviewText: "!text-[#e0e2ed]",
    identityPreviewEditButton: "!text-[#adc6ff] hover:!text-[#d8e2ff]",
    formResendCodeLink: "!text-[#adc6ff] hover:!text-[#d8e2ff]",
    otpCodeFieldInput:
      "border-[#cbd5e1] !bg-white !text-[#111827] focus:border-[#adc6ff]",
    alert: "border border-[#424754] bg-[#0d121f] !text-[#e0e2ed]",
    alertText: "!text-[#e0e2ed]",
    formFieldErrorText: "!text-[#ffb4ab]",
    formFieldHintText: "!text-[#c2c6d6]",
    formHeaderTitle: "!text-[#f8fafc]",
    formHeaderSubtitle: "!text-[#c2c6d6]",
    alternativeMethodsBlockButton:
      "border-[#424754] bg-[#0d121f] !text-[#e0e2ed] hover:border-[#adc6ff] hover:bg-[#262a32]",
    alternativeMethodsBlockButtonText: "!text-[#e0e2ed]",
    backLink: "!text-[#adc6ff] hover:!text-[#d8e2ff]",
    breadcrumbLink: "!text-[#adc6ff]",
    breadcrumbSeparator: "!text-[#8c909f]",
    formFieldAction: "!text-[#adc6ff] hover:!text-[#d8e2ff]",
    footer: "text-[#c2c6d6]",
    footerPagesLink: "!text-[#adc6ff]",
  },
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded bg-[#adc6ff] text-[#002e6a]">
        <MaterialIcon name="trending_up" className="text-[22px]" />
      </div>

      <span className="text-[24px] font-semibold tracking-tight text-[#e0e2ed]">
        MoneySignal AI
      </span>
    </Link>
  );
}

function ScoreRing() {
  return (
    <div className="relative h-16 w-16">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="transparent"
          stroke="#1E293B"
          strokeWidth="4"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="transparent"
          stroke="#adc6ff"
          strokeLinecap="round"
          strokeWidth="4"
          strokeDasharray="175.9"
          strokeDashoffset="22.9"
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] text-[#adc6ff]">
        87
      </span>
    </div>
  );
}

function ProductPreviewCard() {
  return (
    <div className="w-full max-w-[520px] rounded-xl border border-white/10 bg-[#0d121f]/70 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]">
            Global Signal
          </p>
          <h3 className="mt-1 text-[20px] font-semibold text-[#e0e2ed]">
            Institutional Accumulation
          </h3>
        </div>

        <ScoreRing />
      </div>

      <div className="mb-4 rounded-lg border border-[#424754]/50 bg-[#0a0e16]/70 p-4">
        <div className="mb-3 flex items-center gap-2">
          <MaterialIcon name="description" className="text-[18px] text-[#4edea3]" />
          <span className="font-mono text-[12px] uppercase tracking-wide text-[#c2c6d6]">
            SEC 13F-HR Recap
          </span>
        </div>

        <p className="text-[14px] italic leading-relaxed text-[#e0e2ed]">
          “Aggressive increase in technology weightings observed across top-tier
          funds. NVDA exposure up 12%.”
        </p>
      </div>

      <div className="space-y-2">
        {signalRows.map((row) => (
          <div
            key={row.ticker}
            className="flex items-center justify-between border-b border-[#424754]/30 py-2 last:border-b-0"
          >
            <span className="font-mono text-[14px] text-[#e0e2ed]">
              {row.ticker}
            </span>

            <span className={`font-mono text-[14px] ${row.tone}`}>
              {row.score} / {row.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustIndicator({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[#e0e2ed]">
      <MaterialIcon name={icon} className="text-[16px]" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#e0e2ed]">
        {label}
      </span>
    </div>
  );
}

export function AuthPageShell({
  children,
  eyebrow = "Smart Disclosure Intelligence",
  title = "Access your smart-money research terminal.",
  subtitle = "Track insider activity, institutional movement, and AI-explained public disclosures from one unified dashboard.",
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <main
      className="flex min-h-screen w-full overflow-hidden bg-[#10131b] text-[#e0e2ed]"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <section className="relative hidden w-1/2 flex-col overflow-hidden border-r border-white/10 bg-[#0a0e16] p-8 lg:flex">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#3b82f6]/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-[#a855f7]/15 blur-[120px]" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 mt-auto max-w-[620px] pb-12">
          <span className="mb-6 inline-flex rounded-full border border-[#4edea3]/60 px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em] text-[#4edea3]">
            {eyebrow}
          </span>

          <h1 className="mb-6 text-[56px] font-bold leading-[1.15] tracking-[-0.04em] text-[#e0e2ed]">
            {title}
          </h1>

          <p className="max-w-[560px] text-[18px] leading-7 text-[#e0e2ed]">
            {subtitle}
          </p>
        </div>

        <div className="relative z-10 mb-8">
          <ProductPreviewCard />
        </div>
      </section>

      <section className="relative flex w-full items-center justify-center bg-[#10131b] p-6 lg:w-1/2 lg:p-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[620px] w-[620px] rounded-full bg-[#adc6ff]/15 blur-[150px]" />
          <div className="absolute h-[420px] w-[420px] translate-x-20 -translate-y-20 rounded-full bg-[#ddb7ff]/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#0d121f]/70 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>

          {children}

          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-4 border-t border-[#424754]/40 pt-8">
            <TrustIndicator icon="lock" label="Encrypted session" />
            <TrustIndicator icon="analytics" label="Research-only platform" />
            <TrustIndicator icon="no_accounts" label="No brokerage required" />
          </div>
        </div>
      </section>
    </main>
  );
}

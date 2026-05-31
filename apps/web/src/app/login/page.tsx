"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { createMockSession, saveAuthSession } from "@/lib/authSession";

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

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function showComingSoon(feature: string) {
    setNotice(`${feature} is coming soon. For now, use email/password sign in.`);

    window.setTimeout(() => {
      setNotice(null);
    }, 3500);
  }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "analyst@moneysignal.ai");

    const session = createMockSession(email);
    saveAuthSession(session);

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    router.replace(next || "/dashboard");
    }

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
            Smart Disclosure Intelligence
          </span>

          <h1 className="mb-6 text-[56px] font-bold leading-[1.15] tracking-[-0.04em] text-[#e0e2ed]">
            Access your smart-money research terminal.
          </h1>

          <p className="max-w-[560px] text-[18px] leading-7 text-[#e0e2ed]">
            Track insider activity, institutional movement, and AI-explained
            public disclosures from one unified dashboard.
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

          <div className="mb-8 text-center lg:text-left">
            <h2 className="mb-2 text-[28px] font-semibold tracking-[-0.01em] text-[#e0e2ed]">
              {notice ? (
                <div className="mb-5 rounded border border-[#adc6ff]/30 bg-[#adc6ff]/10 px-4 py-3 text-[13px] text-[#adc6ff]">
                  {notice}
                </div>
              ) : null}
              Welcome back
            </h2>
            <p className="text-[16px] text-[#e0e2ed]">
              Sign in to continue to MoneySignal AI.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]"
              >
                Institutional Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@firm.com"
                className="w-full rounded border border-[#424754] bg-[#181c23] px-4 py-3 text-[16px] text-[#e0e2ed] outline-none placeholder:text-[#8c909f] transition-all focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-mono text-[12px] uppercase tracking-wider text-[#c2c6d6]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded border border-[#424754] bg-[#181c23] px-4 py-3 pr-12 text-[16px] text-[#e0e2ed] outline-none placeholder:text-[#8c909f] transition-all focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c909f] transition-colors hover:text-[#e0e2ed]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <MaterialIcon
                    name={showPassword ? "visibility_off" : "visibility"}
                    className="text-[20px]"
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="group flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-sm border border-[#424754] bg-[#181c23] accent-[#adc6ff]"
                />
                <span className="text-[14px] text-[#e0e2ed] transition-colors group-hover:text-[#adc6ff]">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => showComingSoon("Forgot password")}
                className="text-[14px] text-[#adc6ff] transition-colors hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded bg-[#adc6ff] py-3 text-[16px] font-semibold text-[#002e6a] shadow-lg shadow-[#adc6ff]/10 transition-all hover:bg-[#d8e2ff] active:scale-[0.98]"
            >
              Sign In
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-[#424754]" />
              <span className="mx-4 flex-shrink font-mono text-[12px] uppercase tracking-wider text-[#e0e2ed]">
                Or continue with
              </span>
              <div className="flex-grow border-t border-[#424754]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => showComingSoon("Google sign in")}
                className="flex items-center justify-center gap-2 rounded border border-[#424754] bg-[#181c23] py-2.5 text-[14px] text-[#e0e2ed] transition-all hover:border-[#adc6ff] hover:bg-[#262a32]"
              >
                <span className="font-semibold text-[#adc6ff]">G</span>
                Google
              </button>

              <button
                type="button"
                onClick={() => showComingSoon("GitHub sign in")}
                className="flex items-center justify-center gap-2 rounded border border-[#424754] bg-[#181c23] py-2.5 text-[14px] text-[#e0e2ed] transition-all hover:border-[#adc6ff] hover:bg-[#262a32]"
              >
                <MaterialIcon name="terminal" className="text-[18px]" />
                GitHub
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[15px] text-[#c2c6d6]">
              New to MoneySignal AI?{" "}
              <button
              type="button"
              onClick={() => showComingSoon("Request access")}
              className="font-semibold text-[#adc6ff] transition-colors hover:underline"
            >
              Request access
            </button>
            </p>
          </div>

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
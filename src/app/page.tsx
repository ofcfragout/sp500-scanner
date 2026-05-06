import { Dashboard } from "@/components/dashboard/dashboard";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import Link from "next/link";
import { Table2 } from "lucide-react";

/** Allows long-running Yahoo + Supabase sync from the dashboard server action. */
export const maxDuration = 300;

export default function Home() {
  return (
    <div className="dash-bg min-h-full text-[var(--app-text)]">
      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              S&amp;P 500 · Technical command
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
              DiazDAQ
            </h1>
            {/* <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
              Live board for names that cleared the multi-factor screen (trend, momentum, volume,
              structure, 23.6% Fib proximity, weekly confirmation). Data streams from Supabase
              Realtime; runs refresh when new scans land.
            </p> */}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/table"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/20 hover:text-white"
            >
              <Table2 className="size-3.5" aria-hidden />
              Metrics table
            </Link>
            <ThemeSwitcher />
            {/* <span className="rounded-full border border-white/[0.08] bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-[var(--app-muted)]">
              Yahoo · <span className="text-[var(--app-text)]/80">same tape as yfinance</span>
            </span>
            <span className="rounded-full border px-3 py-1.5 text-xs font-medium text-[var(--accent)]/90" style={{ borderColor: "rgba(var(--accent-rgb),0.25)", backgroundColor: "rgba(var(--accent-rgb),0.08)" }}>
              Edge-ranked payloads only
            </span> */}
          </div>
        </header>

        <Dashboard />
      </div>
    </div>
  );
}

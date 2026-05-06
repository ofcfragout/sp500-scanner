import { StocksMetricsTable } from "@/components/dashboard/stocks-metrics-table";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import Link from "next/link";
import { ArrowLeft, Crosshair, Table2 } from "lucide-react";

export default function TablePage() {
  return (
    <div className="dash-bg min-h-full text-[var(--app-text)]">
      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              S&amp;P 500 · Metrics board
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Table2 className="size-8 text-emerald-400/90 sm:size-9" strokeWidth={1.5} aria-hidden />
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
                Stocks table
              </h1>
            </div>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              <ArrowLeft className="size-3.5" />
              Back to dashboard
            </Link>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <Link
              href="/targets"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/20 hover:text-white"
            >
              <Crosshair className="size-3.5" aria-hidden />
              Profit targets
            </Link>
            <ThemeSwitcher />
          </div>
        </header>

        <StocksMetricsTable />
      </div>
    </div>
  );
}

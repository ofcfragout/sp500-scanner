import { ProfitTargetsTable } from "@/components/dashboard/profit-targets-table";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import Link from "next/link";
import { ArrowLeft, Crosshair } from "lucide-react";

export default function TargetsPage() {
  return (
    <div className="dash-bg min-h-full text-[var(--app-text)]">
      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              S&amp;P 500 · Levels
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Crosshair className="size-8 text-emerald-400/90 sm:size-9" strokeWidth={1.5} aria-hidden />
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl">
                Profit targets
              </h1>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--app-muted)]">
              Projection levels from each symbol&apos;s recent impulse leg (swing low → swing high in the
              Fib 23.6% scan window): prior swing high, Fib extensions (+127.2% / +161.8% beyond that
              high), and a full measured move (100% of the impulse range above the high).
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--app-muted)]">
              <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[var(--app-text)]">
                <ArrowLeft className="size-3.5" />
                Dashboard
              </Link>
              <Link href="/table" className="hover:text-[var(--app-text)]">
                Metrics table →
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <ThemeSwitcher />
          </div>
        </header>

        <ProfitTargetsTable />
      </div>
    </div>
  );
}

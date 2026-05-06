"use client";

import { formatUsd, num, relativeTime } from "@/lib/format";
import type { StockSetupRow } from "@/lib/types";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Radio,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadersBarChart, ScoreRadar } from "./insight-charts";
import { ScanRunButton } from "./scan-run-button";
import { StockTable, type SortColumn, type SortDir } from "./stock-table";
import { DiagnosticsTabs } from "./diagnostics-tabs";
import { useStockSetups } from "./use-stock-setups";

function latestUpdate(rows: StockSetupRow[]): string | undefined {
  let max = 0;
  let iso: string | undefined;
  for (const r of rows) {
    if (!r.updated_at) continue;
    const t = new Date(r.updated_at).getTime();
    if (t > max) {
      max = t;
      iso = r.updated_at;
    }
  }
  return iso;
}

function closeFromRow(row: StockSetupRow | null): number {
  if (!row) return NaN;
  const details = row.details as unknown as { trend?: { close?: unknown } } | null;
  const v = details?.trend?.close;
  return typeof v === "number" && Number.isFinite(v) ? v : NaN;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 shadow-lg shadow-black/30 transition-all hover:border-emerald-500/15 hover:shadow-emerald-900/10">
      <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-emerald-500/[0.06] blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Icon className="size-5 text-emerald-400/90" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-white">{value}</p>
          {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { rows, status, message, reload } = useStockSetups();
  const [query, setQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("composite_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  /** User focus; falls back when filtered out */
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const filteredSorted = useMemo(() => {
    let list = rows.filter((r) => r.ticker.toLowerCase().includes(query.trim().toLowerCase()));

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortColumn === "ticker") {
        return dir * a.ticker.localeCompare(b.ticker);
      }
      return dir * (num(a[sortColumn]) - num(b[sortColumn]));
    });

    return list;
  }, [rows, query, sortColumn, sortDir]);

  const focusTicker = useMemo(() => {
    if (!filteredSorted.length) return null;
    if (selectedTicker && filteredSorted.some((r) => r.ticker === selectedTicker)) {
      return selectedTicker;
    }
    return filteredSorted[0]!.ticker;
  }, [filteredSorted, selectedTicker]);

  const selected = useMemo(
    () => filteredSorted.find((r) => r.ticker === focusTicker) ?? null,
    [filteredSorted, focusTicker],
  );

  const kpis = useMemo(() => {
    const n = rows.length;
    if (!n) return { mean: 0, breadth: 0 };
    const scores = rows.map((r) => num(r.composite_score)).filter(Number.isFinite);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const strong = scores.filter((s) => s >= 65).length;
    const breadth = (strong / scores.length) * 100;
    return { mean, breadth };
  }, [rows]);

  const onSort = useCallback((col: SortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDir(col === "ticker" ? "asc" : "desc");
    } else {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    }
  }, [sortColumn]);

  const navRow = useCallback(
    (delta: number) => {
      const idx = filteredSorted.findIndex((r) => r.ticker === focusTicker);
      if (idx < 0) return;
      const next = filteredSorted[(idx + delta + filteredSorted.length) % filteredSorted.length];
      if (next) setSelectedTicker(next.ticker);
    },
    [filteredSorted, focusTicker],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        navRow(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navRow(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navRow]);

  if (status === "config") {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-6 text-sm text-amber-100">
        <p className="font-medium text-amber-50">Supabase environment</p>
        <p className="mt-2 text-amber-200/85">{message}</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="size-12 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
        <p className="text-sm text-zinc-500">Loading scan results…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-500/25 bg-red-950/35 p-6 text-sm text-red-100">
          <p className="font-semibold text-red-50">Could not reach Supabase</p>
          <p className="mt-2 text-red-200/85">{message}</p>
        </div>
        <ScanRunButton onComplete={() => reload?.()} />
        <p className="text-xs text-zinc-600">
          A scan still writes with the service role on the server. Use Refresh after fixing client access.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-8 text-center">
        <Layers className="mx-auto size-10 text-zinc-600" strokeWidth={1.25} />
        <p className="mt-4 text-zinc-300">No setups published yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Run a full market scan from here or call{" "}
          <code className="rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-xs text-emerald-400/90">
            POST /api/scan
          </code>{" "}
          (optional <code className="font-mono text-xs text-zinc-400">X-Scan-Secret</code> if configured).
          Realtime will update this board when rows land.
        </p>
        <div className="mt-8 flex justify-center">
          <ScanRunButton variant="primary" onComplete={() => reload?.()} />
        </div>
      </div>
    );
  }

  const updated = relativeTime(latestUpdate(rows));

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Layers} label="Published setups" value={`${rows.length}`} hint="Top-qualified names from last scan" />
        <KpiCard
          icon={TrendingUp}
          label="Avg composite"
          value={kpis.mean.toFixed(1)}
          hint="Mean score across published rows"
        />
        <KpiCard
          icon={Activity}
          label="Strength breadth"
          value={`${kpis.breadth.toFixed(0)}%`}
          hint="Share with composite ≥ 65"
        />
        <KpiCard icon={Radio} label="Dataset age" value={updated} hint="Newest row timestamp" />
      </div>

      <div className="grid gap-8 xl:grid-cols-12 xl:items-start">
        {/* Main column */}
        <div className="space-y-4 xl:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                placeholder="Filter ticker…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none ring-emerald-500/0 transition-[box-shadow,border-color] placeholder:text-zinc-600 focus:border-emerald-500/25 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ScanRunButton onComplete={() => reload?.()} />
              <button
                type="button"
                onClick={() => reload?.()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/20 hover:text-white"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
              <span className="hidden text-xs text-zinc-600 sm:inline">↑↓ navigate rows</span>
            </div>
          </div>

          <StockTable
            rows={filteredSorted}
            selectedTicker={focusTicker}
            onSelect={setSelectedTicker}
            sortColumn={sortColumn}
            sortDir={sortDir}
            onSort={onSort}
          />

          <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-400/90 ring-1 ring-emerald-500/20">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Live Supabase Realtime
            </span>
            Showing {filteredSorted.length} of {rows.length} rows
          </p>
        </div>

        {/* Insight column */}
        <aside className="space-y-4 xl:col-span-4 xl:sticky xl:top-6">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-zinc-900/50 to-zinc-950/90 p-5 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Focus</p>
                <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-emerald-300">
                  {selected?.ticker ?? "—"}
                </p>
              </div>
              <div className="flex rounded-lg border border-white/[0.06] bg-zinc-950/80 p-0.5">
                <button
                  type="button"
                  aria-label="Previous row"
                  className="rounded-md p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  onClick={() => navRow(-1)}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next row"
                  className="rounded-md p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  onClick={() => navRow(1)}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {selected ? (
              <div className="mt-4">
                <Link
                  href={`/stock/${encodeURIComponent(selected.ticker)}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-[var(--accent)]/40 hover:text-white"
                >
                  Open stock page
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            ) : null}

            {selected ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Close", closeFromRow(selected)],
                      ["Composite", num(selected.composite_score)],
                      ["Trend", num(selected.trend_score)],
                      ["Momentum", num(selected.momentum_score)],
                      ["Volume", num(selected.volume_score)],
                    ] as const
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl border border-white/[0.05] bg-black/25 px-3 py-2.5"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{k}</p>
                      <p className="mt-0.5 font-mono text-lg font-semibold text-white">
                        {k === "Close" ? formatUsd(v as number) : (v as number).toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Factor radar</p>
                  <ScoreRadar row={selected} />
                </div>

                <div className="mt-6 border-t border-white/[0.06] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Diagnostics
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Key indicators used for scoring (plus raw payload).
                  </p>
                  <DiagnosticsTabs row={selected} />
                </div>
              </>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/35 p-5 shadow-lg shadow-black/30">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Leaderboard</p>
            <p className="mt-1 text-xs text-zinc-600">Highest composite scores in current dataset</p>
            <div className="mt-3">
              <LeadersBarChart rows={rows} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

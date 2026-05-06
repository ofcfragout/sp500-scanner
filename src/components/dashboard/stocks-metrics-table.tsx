"use client";

import { cn } from "@/lib/cn";
import { formatUsd, num } from "@/lib/format";
import type { StockSetupRow } from "@/lib/types";
import Link from "next/link";
import { ChevronDown, ChevronUp, RefreshCw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ScanRunButton } from "./scan-run-button";
import { useStockSetups } from "./use-stock-setups";

export type MetricsSortColumn =
  | "ticker"
  | "composite_score"
  | "trend_score"
  | "close"
  | "fib236"
  | "pct_away"
  | "rsi"
  | "vol_ratio";

export type MetricsSortDir = "asc" | "desc";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function metricsFromRow(row: StockSetupRow) {
  const d = isRecord(row.details) ? row.details : {};
  const trend = isRecord(d.trend) ? d.trend : {};
  const momentum = isRecord(d.momentum) ? d.momentum : {};
  const volume = isRecord(d.volume) ? d.volume : {};
  const fib = isRecord(d.fibonacci_236) ? d.fibonacci_236 : {};

  const close = typeof trend.close === "number" && Number.isFinite(trend.close) ? trend.close : NaN;
  const fib236 = typeof fib.fib236 === "number" && Number.isFinite(fib.fib236) ? fib.fib236 : NaN;
  const pctAway =
    typeof fib.dist_pct === "number" && Number.isFinite(fib.dist_pct) ? fib.dist_pct * 100 : NaN;
  const rsi =
    typeof momentum.rsi14 === "number" && Number.isFinite(momentum.rsi14) ? momentum.rsi14 : NaN;
  const volRatio =
    typeof volume.vol_ratio_20d === "number" && Number.isFinite(volume.vol_ratio_20d)
      ? volume.vol_ratio_20d
      : NaN;

  return { close, fib236, pctAway, rsi, volRatio };
}

/** Price vs 20/50 SMA from scan diagnostics — aligns with trend scorer inputs. */
function trendUpDown(row: StockSetupRow): "up" | "down" | null {
  const d = isRecord(row.details) ? row.details : {};
  const trend = isRecord(d.trend) ? d.trend : {};
  const close = trend.close;
  const sma20 = trend.sma20;
  const sma50 = trend.sma50;
  if (
    typeof close !== "number" ||
    typeof sma20 !== "number" ||
    typeof sma50 !== "number" ||
    !Number.isFinite(close) ||
    !Number.isFinite(sma20) ||
    !Number.isFinite(sma50)
  ) {
    return null;
  }

  const aboveBoth = close > sma20 && close > sma50;
  const belowBoth = close < sma20 && close < sma50;
  if (aboveBoth && sma20 > sma50) return "up";
  if (belowBoth && sma20 < sma50) return "down";
  if (aboveBoth) return "up";
  if (belowBoth) return "down";
  return close >= sma50 ? "up" : "down";
}

function SortIcon({ active, dir }: { active: boolean; dir: MetricsSortDir }) {
  if (!active) return <span className="inline-block w-4" />;
  return dir === "desc" ? (
    <ChevronDown className="size-4 opacity-90" aria-hidden />
  ) : (
    <ChevronUp className="size-4 opacity-90" aria-hidden />
  );
}

function formatPctAway(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(2)}%`;
}

function formatVolRatio(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return `${v.toFixed(2)}×`;
}

export function StocksMetricsTable() {
  const { rows, status, message, reload } = useStockSetups();
  const [query, setQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<MetricsSortColumn>("composite_score");
  const [sortDir, setSortDir] = useState<MetricsSortDir>("desc");

  const filteredSorted = useMemo(() => {
    let list = rows.filter((r) => r.ticker.toLowerCase().includes(query.trim().toLowerCase()));

    const dir = sortDir === "asc" ? 1 : -1;

    const sortVal = (r: StockSetupRow): number | string => {
      const m = metricsFromRow(r);
      switch (sortColumn) {
        case "ticker":
          return r.ticker;
        case "composite_score":
          return num(r.composite_score);
        case "trend_score":
          return num(r.trend_score);
        case "close":
          return m.close;
        case "fib236":
          return m.fib236;
        case "pct_away":
          return m.pctAway;
        case "rsi":
          return m.rsi;
        case "vol_ratio":
          return m.volRatio;
        default:
          return NaN;
      }
    };

    list = [...list].sort((a, b) => {
      const va = sortVal(a);
      const vb = sortVal(b);

      if (sortColumn === "ticker") {
        return dir * String(va).localeCompare(String(vb));
      }

      const na = typeof va === "number" && !Number.isFinite(va);
      const nb = typeof vb === "number" && !Number.isFinite(vb);
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;

      return dir * ((va as number) - (vb as number));
    });

    return list;
  }, [rows, query, sortColumn, sortDir]);

  const onSort = useCallback(
    (col: MetricsSortColumn) => {
      if (sortColumn !== col) {
        setSortColumn(col);
        setSortDir(col === "ticker" ? "asc" : "desc");
      } else {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      }
    },
    [sortColumn],
  );

  const th = (col: MetricsSortColumn, label: string, className?: string) => {
    const active = sortColumn === col;
    return (
      <th
        scope="col"
        className={cn("px-3 py-3 text-left", className)}
        aria-sort={active ? (sortDir === "desc" ? "descending" : "ascending") : undefined}
      >
        <button
          type="button"
          onClick={() => onSort(col)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
            active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {label}
          <SortIcon active={active} dir={sortDir} />
        </button>
      </th>
    );
  };

  if (status === "config") {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        {message}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/25 px-4 py-8 text-center text-sm text-zinc-500">
        Loading setups…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        {message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm">
                {th("ticker", "Ticker", "pl-4")}
                {th("composite_score", "Score")}
                {th("trend_score", "Trend")}
                {th("close", "Close")}
                {th("fib236", "Fib236")}
                {th("pct_away", "% Away")}
                {th("rsi", "RSI")}
                {th("vol_ratio", "Vol x Avg")}
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => {
                const m = metricsFromRow(r);
                const trendDir = trendUpDown(r);
                return (
                  <tr
                    key={r.ticker}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/stock/${encodeURIComponent(r.ticker)}`}
                        className="font-mono text-sm font-semibold tracking-wide text-emerald-300 hover:text-emerald-200 hover:underline"
                      >
                        {r.ticker}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-base font-semibold text-white">
                      {num(r.composite_score).toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      {trendDir ? (
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            trendDir === "up"
                              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                              : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25",
                          )}
                        >
                          {trendDir === "up" ? "Up" : "Down"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {formatUsd(m.close)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {formatUsd(m.fib236)}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-300">
                      {formatPctAway(m.pctAway)}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-200">
                      {Number.isFinite(m.rsi) ? m.rsi.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-200">
                      {formatVolRatio(m.volRatio)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

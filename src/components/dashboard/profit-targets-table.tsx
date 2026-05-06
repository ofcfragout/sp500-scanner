"use client";

import { cn } from "@/lib/cn";
import { formatUsd, num } from "@/lib/format";
import { impulseProfitTargets, pctVersusClose } from "@/lib/profit-targets";
import type { StockSetupRow } from "@/lib/types";
import Link from "next/link";
import { ChevronDown, ChevronUp, RefreshCw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ScanRunButton } from "./scan-run-button";
import { useStockSetups } from "./use-stock-setups";

export type TargetsSortColumn =
  | "ticker"
  | "composite_score"
  | "close"
  | "prior_high"
  | "ext127"
  | "ext162"
  | "measured_move";

export type TargetsSortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: TargetsSortDir }) {
  if (!active) return <span className="inline-block w-4" />;
  return dir === "desc" ? (
    <ChevronDown className="size-4 opacity-90" aria-hidden />
  ) : (
    <ChevronUp className="size-4 opacity-90" aria-hidden />
  );
}

function formatDeltaPct(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function deltaClass(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "text-zinc-500";
  if (v > 0.05) return "text-emerald-400";
  if (v < -0.05) return "text-rose-400";
  return "text-zinc-400";
}

export function ProfitTargetsTable() {
  const { rows, status, message, reload } = useStockSetups();
  const [query, setQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<TargetsSortColumn>("composite_score");
  const [sortDir, setSortDir] = useState<TargetsSortDir>("desc");

  const filteredSorted = useMemo(() => {
    let list = rows.filter((r) => r.ticker.toLowerCase().includes(query.trim().toLowerCase()));

    const dir = sortDir === "asc" ? 1 : -1;

    const sortVal = (r: StockSetupRow): number | string => {
      const t = impulseProfitTargets(r);
      switch (sortColumn) {
        case "ticker":
          return r.ticker;
        case "composite_score":
          return num(r.composite_score);
        case "close":
          return t?.close ?? NaN;
        case "prior_high":
          return t?.priorHigh ?? NaN;
        case "ext127":
          return t?.ext127 ?? NaN;
        case "ext162":
          return t?.ext162 ?? NaN;
        case "measured_move":
          return t?.measuredMove ?? NaN;
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
    (col: TargetsSortColumn) => {
      if (sortColumn !== col) {
        setSortColumn(col);
        setSortDir(col === "ticker" ? "asc" : "desc");
      } else {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      }
    },
    [sortColumn],
  );

  const th = (col: TargetsSortColumn, label: string, className?: string) => {
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
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm">
                {th("ticker", "Ticker", "pl-4")}
                {th("composite_score", "Score")}
                {th("close", "Close")}
                {th("prior_high", "Prior high")}
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  Δ Prior
                </th>
                {th("ext127", "+127%")}
                {th("ext162", "+162%")}
                {th("measured_move", "Meas. move")}
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => {
                const t = impulseProfitTargets(r);
                const dPrior = t ? pctVersusClose(t.close, t.priorHigh) : null;
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
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {t ? formatUsd(t.close) : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {t ? formatUsd(t.priorHigh) : "—"}
                    </td>
                    <td className={cn("px-3 py-2.5 font-mono text-xs tabular-nums", deltaClass(dPrior))}>
                      {formatDeltaPct(dPrior)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {t ? formatUsd(t.ext127) : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {t ? formatUsd(t.ext162) : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {t ? formatUsd(t.measuredMove) : "—"}
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

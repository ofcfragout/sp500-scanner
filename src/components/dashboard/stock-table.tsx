"use client";

import { cn } from "@/lib/cn";
import { formatUsd, num } from "@/lib/format";
import type { StockSetupRow } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScoreBar } from "./score-bar";

function closeFromRow(row: StockSetupRow): number {
  const details = row.details as unknown as { trend?: { close?: unknown } } | null;
  const v = details?.trend?.close;
  return typeof v === "number" && Number.isFinite(v) ? v : NaN;
}

export type SortColumn =
  | "ticker"
  | "composite_score"
  | "trend_score"
  | "momentum_score"
  | "volume_score"
  | "structure_score"
  | "fib_score"
  | "weekly_score";

export type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="inline-block w-4" />;
  return dir === "desc" ? (
    <ChevronDown className="size-4 opacity-90" aria-hidden />
  ) : (
    <ChevronUp className="size-4 opacity-90" aria-hidden />
  );
}

export function StockTable({
  rows,
  selectedTicker,
  onSelect,
  sortColumn,
  sortDir,
  onSort,
}: {
  rows: StockSetupRow[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  sortColumn: SortColumn;
  sortDir: SortDir;
  onSort: (col: SortColumn) => void;
}) {
  const th = (col: SortColumn, label: string, className?: string) => {
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm">
              {th("ticker", "Ticker", "pl-4")}
              <th
                scope="col"
                className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
              >
                Close
              </th>
              {th("composite_score", "Composite")}
              {th("trend_score", "Trend")}
              {th("momentum_score", "Momentum")}
              {th("volume_score", "Volume")}
              {th("structure_score", "Structure")}
              {th("fib_score", "Fib")}
              {th("weekly_score", "Weekly")}
              <th scope="col" className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Tags
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const active = r.ticker === selectedTicker;
              return (
                <tr
                  key={r.ticker}
                  onClick={() => onSelect(r.ticker)}
                  className={cn(
                    "cursor-pointer border-b border-white/[0.04] transition-colors outline-none",
                    active
                      ? "bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-500/25"
                      : "hover:bg-white/[0.03]",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-sm font-semibold tracking-wide text-emerald-300">
                      {r.ticker}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-sm font-semibold tabular-nums text-zinc-200">
                      {formatUsd(closeFromRow(r))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-base font-semibold text-white">
                        {num(r.composite_score).toFixed(1)}
                      </span>
                      <ScoreBar value={num(r.composite_score)} className="min-w-[120px]" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={num(r.trend_score)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={num(r.momentum_score)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={num(r.volume_score)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={num(r.structure_score)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={num(r.fib_score)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScoreBar value={num(r.weekly_score)} />
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2.5 text-xs text-zinc-500">
                    {r.summary ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

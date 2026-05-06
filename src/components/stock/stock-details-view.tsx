"use client";

import { DiagnosticsTabs } from "@/components/dashboard/diagnostics-tabs";
import { ScoreRadar } from "@/components/dashboard/insight-charts";
import { formatUsd } from "@/lib/format";
import type { OHLCV, StockSetupRow } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PricePoint = {
  date: string;
  close: number;
  volume: number;
};

function toChartData(bars: OHLCV[]): PricePoint[] {
  return bars.slice(-140).map((b) => ({
    date: b.date.toISOString().slice(0, 10),
    close: b.close,
    volume: b.volume,
  }));
}

export function StockDetailsView({ row, bars }: { row: StockSetupRow; bars: OHLCV[] }) {
  const data = toChartData(bars);
  const latest = data[data.length - 1];

  return (
    <div className="dash-bg min-h-full text-[var(--app-text)]">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              <ArrowLeft className="size-3.5" />
              Back to dashboard
            </Link>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[var(--app-text)]">
              {row.ticker}
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Latest close: <span className="font-semibold text-[var(--app-text)]">{formatUsd(latest?.close)}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/45 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Scores</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              ["Composite", row.composite_score],
              ["Trend", row.trend_score],
              ["Momentum", row.momentum_score],
              ["Volume", row.volume_score],
              ["Structure", row.structure_score],
              ["Fib 23.6%", row.fib_score],
              ["Weekly", row.weekly_score],
            ].map(([label, val]) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
                <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
                  {Number(val).toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/45 p-5 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Price (last 140 sessions)</p>
            <div className="mt-3 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(var(--accent-rgb),0.5)" />
                      <stop offset="100%" stopColor="rgba(var(--accent-rgb),0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="date" minTickGap={28} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                    width={58}
                  />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,10,14,0.96)", border: "1px solid rgba(255,255,255,0.1)" }}
                    formatter={(v, k) =>
                      k === "close"
                        ? [formatUsd(Number(v)), "Close"]
                        : [Number(v).toLocaleString(), "Volume"]
                    }
                  />
                  <Area type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} fill="url(#priceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/45 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Factor profile</p>
            <ScoreRadar row={row} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/45 p-5 lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Diagnostics</p>
            <DiagnosticsTabs row={row} />
          </div>
        </div>
      </div>
    </div>
  );
}


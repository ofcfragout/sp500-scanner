"use client";

import type { StockSetupRow } from "@/lib/types";
import { num } from "@/lib/format";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyles = {
  backgroundColor: "rgba(24, 24, 27, 0.92)",
  border: "1px solid rgba(63, 63, 70, 0.9)",
  borderRadius: "8px",
  fontSize: "12px",
};

export function ScoreRadar({ row }: { row: StockSetupRow }) {
  const data = [
    { axis: "Trend", score: num(row.trend_score) },
    { axis: "Momentum", score: num(row.momentum_score) },
    { axis: "Volume", score: num(row.volume_score) },
    { axis: "Structure", score: num(row.structure_score) },
    { axis: "Fib 23.6%", score: num(row.fib_score) },
    { axis: "Weekly", score: num(row.weekly_score) },
  ];

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="52%" outerRadius="68%" data={data}>
          <PolarGrid stroke="rgba(63, 63, 70, 0.85)" strokeDasharray="4 6" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={36}
            domain={[0, 100]}
            tick={{ fill: "#71717a", fontSize: 9 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#34d399"
            strokeWidth={1.5}
            fill="#34d399"
            fillOpacity={0.22}
          />
          <Tooltip
            cursor={false}
            contentStyle={tooltipStyles}
            formatter={(v) => [`${Number(v).toFixed(1)}`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadersBarChart({ rows }: { rows: StockSetupRow[] }) {
  const data = [...rows]
    .sort((a, b) => num(b.composite_score) - num(a.composite_score))
    .slice(0, 14)
    .map((r) => ({
      name: r.ticker,
      score: Math.round(num(r.composite_score)),
    }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          barCategoryGap="18%"
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={52}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(39, 39, 42, 0.35)" }}
            contentStyle={tooltipStyles}
            formatter={(v) => [`${Number(v)}`, "Composite"]}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} fill="url(#barGrad)" maxBarSize={14} />
          <defs>
            <linearGradient id="barGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.95} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

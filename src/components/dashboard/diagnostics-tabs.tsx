"use client";

import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";
import type { StockSetupRow } from "@/lib/types";
import { useMemo, useState } from "react";

type TabId = "trend" | "momentum" | "volume" | "structure" | "fib" | "weekly" | "raw";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    if (key.toLowerCase().includes("close") || key.toLowerCase().includes("price")) {
      return formatUsd(value);
    }
    if (Math.abs(value) >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function humanKey(k: string): string {
  return k
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function KeyValueGrid({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj);
  if (!entries.length) {
    return <p className="px-4 py-3 text-xs text-zinc-500">No diagnostics for this tab.</p>;
  }

  return (
    <dl className="divide-y divide-white/[0.06]">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3">
          <dt className="min-w-0 truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {humanKey(k)}
          </dt>
          <dd className="font-mono text-xs tabular-nums text-zinc-200">{formatValue(k, v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DiagnosticsTabs({ row }: { row: StockSetupRow }) {
  const [tab, setTab] = useState<TabId>("trend");

  const sections = useMemo(() => {
    const d = isRecord(row.details) ? row.details : {};
    const fibKey = "fibonacci_236";
    const fibRaw = isRecord(d) ? (d[fibKey] as unknown) : undefined;
    return {
      trend: (isRecord(d.trend) ? d.trend : {}) as Record<string, unknown>,
      momentum: (isRecord(d.momentum) ? d.momentum : {}) as Record<string, unknown>,
      volume: (isRecord(d.volume) ? d.volume : {}) as Record<string, unknown>,
      structure: (isRecord(d.structure) ? d.structure : {}) as Record<string, unknown>,
      fib: (isRecord(fibRaw) ? fibRaw : {}) as Record<string, unknown>,
      weekly: (isRecord(d.weekly) ? d.weekly : {}) as Record<string, unknown>,
      raw: d as Record<string, unknown>,
    };
  }, [row.details]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "trend", label: "Trend" },
    { id: "momentum", label: "Momentum" },
    { id: "volume", label: "Volume" },
    { id: "structure", label: "Structure" },
    { id: "fib", label: "Fib" },
    { id: "weekly", label: "Weekly" },
    { id: "raw", label: "Raw" },
  ];

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/60">
      <div className="flex flex-wrap gap-1 border-b border-white/[0.06] bg-zinc-950/80 p-1">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "raw" ? (
        <pre className="max-h-64 overflow-auto p-4 font-mono text-[10px] leading-relaxed text-zinc-500">
          {JSON.stringify(sections.raw ?? {}, null, 2)}
        </pre>
      ) : (
        <KeyValueGrid obj={sections[tab]} />
      )}
    </div>
  );
}


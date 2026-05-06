"use client";

import { cn } from "@/lib/cn";

export function ScoreBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const intensity = 0.28 + (v / 100) * 0.72;
  return (
    <div className={cn("flex items-center gap-2 min-w-[112px]", className)}>
      <div className="h-2 flex-1 max-w-[88px] rounded-full bg-zinc-800/90 ring-1 ring-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${v}%`,
            background: `linear-gradient(90deg, rgba(var(--accent-rgb), ${Math.max(
              0.18,
              intensity - 0.35,
            ).toFixed(2)}), rgba(var(--accent-rgb), ${Math.min(1, intensity).toFixed(2)}))`,
            boxShadow: `0 0 12px rgba(var(--accent-rgb), ${(0.16 + v / 220).toFixed(2)})`,
          }}
        />
      </div>
      <span className="tabular-nums text-xs font-medium text-zinc-400 w-9 text-right">{v.toFixed(0)}</span>
    </div>
  );
}

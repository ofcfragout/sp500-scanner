"use client";

import { cn } from "@/lib/cn";
import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

const THEMES = [
  { id: "emerald-night", label: "Emerald Night" },
  { id: "aurora-ice", label: "Aurora Ice" },
  { id: "sunset-grid", label: "Sunset Grid" },
  { id: "graphite", label: "Graphite" },
  { id: "royal-violet", label: "Royal Violet" },
  { id: "trader-red", label: "Trader Red" },
  { id: "forest", label: "Forest" },
  { id: "deep-ocean", label: "Deep Ocean" },
  { id: "midnight-gold", label: "Midnight Gold" },
  { id: "retro-terminal", label: "Retro Terminal" },
] as const;

const STORAGE_KEY = "sp500-theme";

type ThemeId = (typeof THEMES)[number]["id"];

function isTheme(value: string | null): value is ThemeId {
  return !!value && THEMES.some((t) => t.id === value);
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "emerald-night";
    const saved = localStorage.getItem(STORAGE_KEY);
    return isTheme(saved) ? saved : "emerald-night";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function onThemeChange(next: ThemeId) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-[var(--app-muted)]">
      <Palette className="size-3.5 text-[var(--accent)]" />
      Theme
      <select
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as ThemeId)}
        className={cn(
          "rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs",
          "text-[var(--app-text)] outline-none focus:border-[var(--accent)]",
        )}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}


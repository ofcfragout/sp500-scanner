import { fetchSp500Tickers, toYahooSymbol } from "./sp500";
import { scoreSymbol } from "./scoring";
import { fetchDailyBars } from "./yahoo";
import type { ScoreBreakdown, StockSetupRow } from "./types";

export interface ScanOptions {
  /** Cap universe for faster dev runs */
  maxTickers?: number;
  /** Minimum composite score (0–100) to qualify */
  minComposite?: number;
  /** Keep only top N after sorting */
  topN?: number;
  /** Parallel Yahoo requests */
  concurrency?: number;
}

export interface ScanResult {
  scanned: number;
  qualified: number;
  errors: number;
  durationMs: number;
  top: ScoreBreakdown[];
}

/** Run scoring pipeline and sync results to Supabase (shared by API route + server actions). */
export interface PerformScanResult {
  scanned: number;
  qualified: number;
  published: number;
  errors: number;
  durationMs: number;
  tickers: string[];
}

export async function performScan(opts: ScanOptions = {}): Promise<PerformScanResult> {
  const scan = await runScan(opts);
  const rows = breakdownsToRows(scan.top);
  await syncSetupsToSupabase(rows);
  return {
    scanned: scan.scanned,
    qualified: scan.qualified,
    published: rows.length,
    errors: scan.errors,
    durationMs: scan.durationMs,
    tickers: rows.map((r) => r.ticker),
  };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function runScan(opts: ScanOptions = {}): Promise<ScanResult> {
  const maxTickers = opts.maxTickers ?? Infinity;
  const minComposite = opts.minComposite ?? 4;
  const topN = opts.topN ?? 600;
  const concurrency = opts.concurrency ?? 10;

  const started = Date.now();
  let all = await fetchSp500Tickers();
  if (Number.isFinite(maxTickers)) all = all.slice(0, maxTickers as number);

  let errors = 0;
  const scored: ScoreBreakdown[] = [];

  const outcomes = await mapPool(all, concurrency, async (ticker) => {
    const sym = toYahooSymbol(ticker);
    try {
      const daily = await fetchDailyBars(sym);
      const breakdown = scoreSymbol(ticker, daily);
      return breakdown;
    } catch {
      errors++;
      return null;
    }
  });

  for (const row of outcomes) {
    if (row && row.composite >= minComposite) scored.push(row);
  }

  scored.sort((a, b) => b.composite - a.composite);
  const top = scored.slice(0, topN);

  return {
    scanned: all.length,
    qualified: scored.length,
    errors,
    durationMs: Date.now() - started,
    top,
  };
}

export function breakdownsToRows(breakdowns: ScoreBreakdown[]): StockSetupRow[] {
  return breakdowns.map((b) => ({
    ticker: b.ticker,
    composite_score: Math.round(b.composite * 100) / 100,
    trend_score: Math.round(b.trend * 100) / 100,
    momentum_score: Math.round(b.momentum * 100) / 100,
    volume_score: Math.round(b.volume * 100) / 100,
    structure_score: Math.round(b.structure * 100) / 100,
    fib_score: Math.round(b.fib * 100) / 100,
    weekly_score: Math.round(b.weekly * 100) / 100,
    summary: b.summary,
    details: b.details,
    updated_at: new Date().toISOString(),
  }));
}

export async function syncSetupsToSupabase(rows: StockSetupRow[]): Promise<void> {
  const { createServiceSupabaseClient } = await import("./supabase/admin");
  const sb = createServiceSupabaseClient();

  const { data: existing, error: selErr } = await sb.from("stock_setups").select("ticker");
  if (selErr) throw selErr;

  if (rows.length === 0) {
    const { error } = await sb.from("stock_setups").delete().neq("ticker", "");
    if (error) throw error;
    return;
  }

  const { error: upErr } = await sb.from("stock_setups").upsert(rows, {
    onConflict: "ticker",
  });
  if (upErr) throw upErr;

  const keep = new Set(rows.map((r) => r.ticker));
  const stale = (existing ?? []).map((r) => r.ticker).filter((t) => !keep.has(t));

  const chunk = 80;
  for (let i = 0; i < stale.length; i += chunk) {
    const part = stale.slice(i, i + chunk);
    const { error } = await sb.from("stock_setups").delete().in("ticker", part);
    if (error) throw error;
  }
}

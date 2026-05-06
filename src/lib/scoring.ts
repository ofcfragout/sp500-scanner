import type { OHLCV, ScoreBreakdown } from "./types";
import {
  closes,
  macdHistogram,
  pivotHighs,
  pivotLows,
  rsi,
  sma,
  toWeeklyBars,
} from "./indicators";

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Higher closes above rising averages → uptrend quality. */
function scoreTrend(daily: OHLCV[]): { score: number; meta: Record<string, unknown> } {
  const c = closes(daily);
  const s20 = sma(c, 20);
  const s50 = sma(c, 50);
  const last = c[c.length - 1]!;
  const s20p = sma(c.slice(0, -5), 20);

  if (!Number.isFinite(s20) || !Number.isFinite(s50)) {
    return { score: 0, meta: { reason: "insufficient_ma_data" } };
  }

  let pts = 0;
  if (last > s20) pts += 28;
  if (last > s50) pts += 28;
  if (s20 > s50) pts += 22;
  if (Number.isFinite(s20p) && s20 > s20p) pts += 22;

  const score = clamp(pts);
  return {
    score,
    meta: { close: last, sma20: s20, sma50: s50, sma20_rising: s20 > s20p },
  };
}

/** RSI + MACD histogram: continuation-friendly momentum. */
function scoreMomentum(daily: OHLCV[]): { score: number; meta: Record<string, unknown> } {
  const c = closes(daily);
  const r = rsi(c, 14);
  const hist = macdHistogram(c);

  if (!Number.isFinite(r)) return { score: 0, meta: { reason: "insufficient_rsi" } };

  const sweetLo = 48;
  const sweetHi = 68;
  let rsiPts: number;
  if (r >= sweetLo && r <= sweetHi) rsiPts = 55 + (35 - Math.abs(r - 58) * 3);
  else if (r > sweetHi && r <= 78) rsiPts = 35 - (r - sweetHi) * 1.2;
  else if (r < sweetLo) rsiPts = 40 + (r - 25) * 1.1;
  else rsiPts = 30;

  rsiPts = clamp(rsiPts, 0, 55);

  let macdPts = 0;
  if (Number.isFinite(hist)) {
    const scaled = Math.tanh(hist / (c[c.length - 1]! * 0.002)) * 45 + 45;
    macdPts = clamp(scaled);
  }

  const score = clamp(rsiPts * 0.55 + macdPts * 0.45);
  return { score, meta: { rsi14: r, macd_hist: hist } };
}

/** Participation vs 20-day average volume. */
function scoreVolume(daily: OHLCV[]): { score: number; meta: Record<string, unknown> } {
  if (daily.length < 25) return { score: 0, meta: { reason: "short_history" } };
  const vols = daily.map((b) => b.volume).filter((v) => v > 0);
  const last = vols[vols.length - 1]!;
  const avg20 =
    vols.slice(-21, -1).reduce((a, b) => a + b, 0) / Math.min(20, vols.length - 1);
  if (!avg20) return { score: 30, meta: { ratio: null } };

  const ratio = last / avg20;
  const score = clamp(Math.min(100, ratio * 42 + 25));
  return { score, meta: { vol_ratio_20d: ratio } };
}

/** Higher lows / bullish swings over recent pivots. */
function scoreStructure(daily: OHLCV[]): { score: number; meta: Record<string, unknown> } {
  const lows = pivotLows(daily, 55);
  const highs = pivotHighs(daily, 55);
  if (lows.length < 2) return { score: 35, meta: { pivots: lows.length } };

  const lastLow = lows[lows.length - 1]!;
  const prevLow = lows[lows.length - 2]!;
  const hl = lastLow > prevLow ? 40 : 10;

  let hh = 20;
  if (highs.length >= 2) {
    const lastH = highs[highs.length - 1]!;
    const prevH = highs[highs.length - 2]!;
    hh = lastH > prevH ? 35 : 15;
  }

  const lastClose = daily[daily.length - 1]!.close;
  const aboveSwing = lastClose >= lastLow * 0.98 ? 25 : 8;

  const score = clamp(hl + hh + aboveSwing);
  return {
    score,
    meta: { pivot_lows: lows.slice(-4), pivot_highs: highs.slice(-4) },
  };
}

/**
 * Impulse leg (60d low → high), shallow pullback to 23.6% retracement.
 * Higher score when price hugs that level (good pullback in uptrend).
 */
function scoreFib236(daily: OHLCV[]): { score: number; meta: Record<string, unknown> } {
  const window = daily.slice(-65);
  if (window.length < 30) return { score: 0, meta: { reason: "short_history" } };

  let lowIdx = 0;
  let lowVal = Infinity;
  let highVal = -Infinity;
  window.forEach((b, i) => {
    if (b.low < lowVal) {
      lowVal = b.low;
      lowIdx = i;
    }
  });
  for (let i = lowIdx; i < window.length; i++) {
    highVal = Math.max(highVal, window[i]!.high);
  }

  if (!Number.isFinite(lowVal) || highVal <= lowVal) {
    return { score: 40, meta: { reason: "no_impulse" } };
  }

  const range = highVal - lowVal;
  const fib236 = highVal - 0.236 * range;
  const last = daily[daily.length - 1]!.close;
  const distPct = Math.abs(last - fib236) / last;

  let score = clamp(100 - distPct * 3800);
  if (last < fib236 * 0.995) score *= 0.85;

  return {
    score: clamp(score),
    meta: { impulse_low: lowVal, impulse_high: highVal, fib236, dist_pct: distPct },
  };
}

/** Weekly trend aligns with constructive daily tape. */
function scoreWeekly(daily: OHLCV[]): { score: number; meta: Record<string, unknown> } {
  const weekly = toWeeklyBars(daily.slice(-400));
  if (weekly.length < 12) return { score: 30, meta: { reason: "few_weeks" } };

  const wc = closes(weekly);
  const w10 = sma(wc, 10);
  const last = wc[wc.length - 1]!;
  const prev = wc[wc.length - 3] ?? wc[wc.length - 2]!;

  let pts = 0;
  if (Number.isFinite(w10) && last > w10) pts += 45;
  if (last > prev) pts += 28;
  const w20 = sma(wc, 20);
  if (Number.isFinite(w20) && last > w20) pts += 27;

  return {
    score: clamp(pts),
    meta: { weekly_close: last, weekly_sma10: w10, weekly_sma20: w20 },
  };
}

export function scoreSymbol(ticker: string, daily: OHLCV[]): ScoreBreakdown | null {
  if (daily.length < 55) return null;

  const trend = scoreTrend(daily);
  const momentum = scoreMomentum(daily);
  const volume = scoreVolume(daily);
  const structure = scoreStructure(daily);
  const fib = scoreFib236(daily);
  const weekly = scoreWeekly(daily);

  const composite =
    (trend.score +
      momentum.score +
      volume.score +
      structure.score +
      fib.score +
      weekly.score) /
    6;

  const summaryParts = [
    trend.score >= 65 ? "trend" : "",
    momentum.score >= 60 ? "momentum" : "",
    volume.score >= 58 ? "volume" : "",
    structure.score >= 62 ? "structure" : "",
    fib.score >= 62 ? "fib236" : "",
    weekly.score >= 60 ? "weekly" : "",
  ].filter(Boolean);

  return {
    ticker,
    trend: trend.score,
    momentum: momentum.score,
    volume: volume.score,
    structure: structure.score,
    fib: fib.score,
    weekly: weekly.score,
    composite,
    summary: summaryParts.join("+") || "mixed",
    details: {
      trend: trend.meta,
      momentum: momentum.meta,
      volume: volume.meta,
      structure: structure.meta,
      fibonacci_236: fib.meta,
      weekly: weekly.meta,
    },
  };
}

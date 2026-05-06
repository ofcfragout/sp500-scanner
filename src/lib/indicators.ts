import type { OHLCV } from "./types";

export function closes(bars: OHLCV[]): number[] {
  return bars.map((b) => b.close);
}

export function sma(values: number[], period: number): number {
  const slice = values.slice(-period);
  if (slice.length < period) return NaN;
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Wilder's RSI on closing prices. */
export function rsi(closesArr: number[], period = 14): number {
  if (closesArr.length < period + 1) return NaN;
  let gains = 0;
  let losses = 0;
  for (let i = closesArr.length - period; i < closesArr.length; i++) {
    const diff = closesArr[i] - closesArr[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** MACD line (12,26 EMA diff) and signal (9 EMA of line); returns last histogram. */
export function macdHistogram(closesArr: number[]): number {
  if (closesArr.length < 35) return NaN;
  const ema12 = emaSeries(closesArr, 12);
  const ema26 = emaSeries(closesArr, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]!);
  const signal = emaSeries(macdLine, 9);
  const hist = macdLine.map((v, i) => v - signal[i]!);
  return hist[hist.length - 1]!;
}

/** Standard EMA seeded with SMA(period). */
function emaSeries(values: number[], period: number): number[] {
  if (values.length < period) return values.slice();
  const k = 2 / (period + 1);
  const out: number[] = new Array(values.length);
  let ema = sma(values.slice(0, period), period);
  out[period - 1] = ema;
  for (let i = period; i < values.length; i++) {
    ema = values[i]! * k + ema * (1 - k);
    out[i] = ema;
  }
  for (let i = 0; i < period - 1; i++) out[i] = values[i]!;
  return out;
}

/** Simple pivot lows: bar low strictly lower than neighbors (window 1). */
export function pivotLows(bars: OHLCV[], lookback = 60): number[] {
  const lows: number[] = [];
  const start = Math.max(1, bars.length - lookback);
  for (let i = start; i < bars.length - 1; i++) {
    const l = bars[i]!.low;
    if (l < bars[i - 1]!.low && l < bars[i + 1]!.low) lows.push(l);
  }
  return lows;
}

export function pivotHighs(bars: OHLCV[], lookback = 60): number[] {
  const highs: number[] = [];
  const start = Math.max(1, bars.length - lookback);
  for (let i = start; i < bars.length - 1; i++) {
    const h = bars[i]!.high;
    if (h > bars[i - 1]!.high && h > bars[i + 1]!.high) highs.push(h);
  }
  return highs;
}

/** Aggregate daily bars into weekly (Friday-last or calendar week). */
export function toWeeklyBars(daily: OHLCV[]): OHLCV[] {
  if (daily.length === 0) return [];
  const weeks = new Map<string, OHLCV>();
  for (const bar of daily) {
    const d = bar.date;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = monday.getUTCDay();
    const diff = (day + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - diff);
    const key = monday.toISOString().slice(0, 10);
    const cur = weeks.get(key);
    if (!cur) {
      weeks.set(key, { ...bar });
    } else {
      cur.high = Math.max(cur.high, bar.high);
      cur.low = Math.min(cur.low, bar.low);
      cur.close = bar.close;
      cur.volume += bar.volume;
    }
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

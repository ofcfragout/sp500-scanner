import type { StockSetupRow } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Upside / downside from close to a price target, as %. */
export function pctVersusClose(close: number, target: number): number | null {
  if (!Number.isFinite(close) || close <= 0 || !Number.isFinite(target)) return null;
  return ((target - close) / close) * 100;
}

/**
 * Targets from the same impulse leg used for Fib 23.6% pullback scoring:
 * swing low → swing high, extended beyond the high for continuation TP ideas.
 */
export function impulseProfitTargets(row: StockSetupRow): {
  close: number;
  impulseLow: number;
  priorHigh: number;
  range: number;
  ext127: number;
  ext162: number;
  measuredMove: number;
} | null {
  const d = isRecord(row.details) ? row.details : {};
  const fib = isRecord(d.fibonacci_236) ? d.fibonacci_236 : {};
  const trend = isRecord(d.trend) ? d.trend : {};

  const impulseLow = fib.impulse_low;
  const impulseHigh = fib.impulse_high;
  const close = trend.close;

  if (
    typeof impulseLow !== "number" ||
    typeof impulseHigh !== "number" ||
    typeof close !== "number" ||
    !Number.isFinite(impulseLow) ||
    !Number.isFinite(impulseHigh) ||
    !Number.isFinite(close)
  ) {
    return null;
  }

  if (impulseHigh <= impulseLow) return null;

  const range = impulseHigh - impulseLow;
  return {
    close,
    impulseLow,
    priorHigh: impulseHigh,
    range,
    ext127: impulseHigh + 0.272 * range,
    ext162: impulseHigh + 0.618 * range,
    measuredMove: impulseHigh + range,
  };
}

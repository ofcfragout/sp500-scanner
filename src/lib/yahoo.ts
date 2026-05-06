import YahooFinance from "yahoo-finance2";
import type { OHLCV } from "./types";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/** Daily OHLCV from Yahoo Finance (same venue data Python `yfinance` uses). */
export async function fetchDailyBars(symbol: string, monthsBack = 18): Promise<OHLCV[]> {
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  /** `historical()` forwards to `chart()` and validates `ChartOptions`, which does not accept `Date` — only string or unix seconds. */
  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);

  const rows = await yahooFinance.historical(symbol, {
    period1,
    period2,
    interval: "1d",
  });

  if (!Array.isArray(rows)) return [];

  const bars: OHLCV[] = [];
  for (const row of rows) {
    if (
      typeof row.open !== "number" ||
      typeof row.high !== "number" ||
      typeof row.low !== "number" ||
      typeof row.close !== "number"
    ) {
      continue;
    }
    bars.push({
      date: row.date instanceof Date ? row.date : new Date(row.date),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: typeof row.volume === "number" ? row.volume : 0,
    });
  }

  bars.sort((a, b) => a.date.getTime() - b.date.getTime());
  return bars;
}

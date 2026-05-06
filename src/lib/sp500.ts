/**
 * S&P 500 constituents from a maintained CSV mirror (same universe as common benchmarks).
 */
export async function fetchSp500Tickers(): Promise<string[]> {
  const url =
    "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "sp500-scanner/1.0",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch S&P 500 list: ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n").slice(1); // skip header

  const tickers: string[] = [];
  for (const line of lines) {
    const firstField = line.split(",")[0]?.trim().replace(/^"|"$/g, "");
    if (firstField) tickers.push(firstField);
  }

  return [...new Set(tickers)].sort();
}

/** Yahoo Finance uses '-' instead of '.' (e.g. BRK.B → BRK-B). */
export function toYahooSymbol(ticker: string): string {
  return ticker.replace(/\./g, "-");
}

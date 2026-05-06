import { StockDetailsView } from "@/components/stock/stock-details-view";
import { toYahooSymbol } from "@/lib/sp500";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { OHLCV, StockSetupRow } from "@/lib/types";
import { fetchDailyBars } from "@/lib/yahoo";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const maxDuration = 300;

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const normalized = ticker.toUpperCase();

  const sb = createServiceSupabaseClient();
  const { data, error } = await sb
    .from("stock_setups")
    .select("*")
    .eq("ticker", normalized)
    .maybeSingle();

  if (error || !data) notFound();

  let bars: OHLCV[] = [];
  try {
    bars = await fetchDailyBars(toYahooSymbol(normalized), 9);
  } catch {
    bars = [];
  }

  return <StockDetailsView row={data as StockSetupRow} bars={bars} />;
}


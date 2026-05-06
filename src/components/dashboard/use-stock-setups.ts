"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { StockSetupRow } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

export type LoadStatus = "config" | "loading" | "ready" | "error";

export function useStockSetups() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const supabaseMissing = !supabase;
  const [rows, setRows] = useState<StockSetupRow[]>([]);
  const [fetchStatus, setFetchStatus] = useState<Exclude<LoadStatus, "config">>("loading");
  const [fetchMessage, setFetchMessage] = useState("");

  const status: LoadStatus = supabaseMissing ? "config" : fetchStatus;
  const message = supabaseMissing
    ? "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    : fetchMessage;

  const load = useCallback(async (client: SupabaseClient) => {
    setFetchStatus("loading");
    const { data, error } = await client
      .from("stock_setups")
      .select("*")
      .order("composite_score", { ascending: false });

    if (error) {
      setFetchStatus("error");
      setFetchMessage(error.message);
      return;
    }
    setRows((data ?? []) as StockSetupRow[]);
    setFetchStatus("ready");
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    let cancelled = false;

    async function run() {
      await load(client);
    }

    void run();

    const channel = client
      .channel("stock_setups_dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_setups" },
        () => {
          if (!cancelled) void load(client);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [supabase, load]);

  return {
    rows,
    status,
    message,
    reload: supabase ? () => load(supabase) : undefined,
  };
}

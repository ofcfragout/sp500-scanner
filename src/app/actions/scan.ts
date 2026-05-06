"use server";

import type { ScanOptions } from "@/lib/scanner";
import { performScan } from "@/lib/scanner";

export type RunScanActionResult =
  | ({ ok: true } & Awaited<ReturnType<typeof performScan>>)
  | { ok: false; error: string };

export async function runScanAction(options?: ScanOptions): Promise<RunScanActionResult> {
  try {
    const result = await performScan(options ?? {});
    return { ok: true, ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    return { ok: false, error: message };
  }
}

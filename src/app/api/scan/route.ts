import { NextResponse } from "next/server";
import { performScan } from "@/lib/scanner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = process.env.SCAN_SECRET;
  if (secret) {
    const hdr = req.headers.get("x-scan-secret");
    if (hdr !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const maxTickers = typeof body.maxTickers === "number" ? body.maxTickers : undefined;
    const minComposite = typeof body.minComposite === "number" ? body.minComposite : undefined;
    const topN = typeof body.topN === "number" ? body.topN : undefined;
    const concurrency = typeof body.concurrency === "number" ? body.concurrency : undefined;

    const result = await performScan({
      maxTickers,
      minComposite,
      topN,
      concurrency,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { performScan } from "@/lib/scanner";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Vercel Cron calls this route on a schedule (GET).
 * Set CRON_SECRET in the project env; Vercel sends Authorization: Bearer <CRON_SECRET>.
 * @see https://vercel.com/docs/cron-jobs
 */
export async function GET(req: Request) {
  const isVercel = process.env.VERCEL === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (isVercel) {
    if (!cronSecret) {
      return NextResponse.json(
        { ok: false, error: "CRON_SECRET is not set in Vercel environment variables" },
        { status: 500 },
      );
    }
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await performScan({});
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

"use client";

import { runScanAction } from "@/app/actions/scan";
import { cn } from "@/lib/cn";
import { Loader2, ScanLine } from "lucide-react";
import { useState, useTransition } from "react";

export function ScanRunButton({
  onComplete,
  className,
  variant = "default",
}: {
  onComplete?: () => void;
  className?: string;
  variant?: "default" | "primary";
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function handleClick() {
    setFeedback(null);
    startTransition(async () => {
      const r = await runScanAction({});
      if (r.ok) {
        const sec = (r.durationMs / 1000).toFixed(1);
        setFeedback({
          kind: "ok",
          text: `Scanned ${r.scanned} symbols · ${r.qualified} qualified · published ${r.published} (${sec}s${r.errors ? ` · ${r.errors} fetch errors` : ""})`,
        });
        onComplete?.();
      } else {
        setFeedback({ kind: "err", text: r.error });
      }
    });
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-60",
          variant === "primary"
            ? "px-5 py-2.5 text-sm bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            : "border border-white/[0.08] bg-zinc-900/70 px-3 py-2 text-xs text-zinc-100 hover:border-emerald-500/25 hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25",
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ScanLine className="size-4" aria-hidden strokeWidth={2} />
        )}
        {pending ? "Running scan…" : "Run full scan"}
      </button>
      {feedback ? (
        <p
          role="status"
          className={cn(
            "max-w-xl text-xs leading-relaxed",
            feedback.kind === "ok" ? "text-emerald-400/90" : "text-red-400/90",
          )}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}

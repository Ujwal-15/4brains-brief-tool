"use client";

import { useEffect, useState } from "react";

type Kind = "success" | "info" | "error";

const kindClass: Record<
  Kind,
  { dot: string; text: string; bg: string; ring: string }
> = {
  success: {
    dot: "bg-secondary",
    text: "text-secondary",
    bg: "bg-secondary/15",
    ring: "ring-1 ring-secondary/30",
  },
  info: {
    dot: "bg-support",
    text: "text-support",
    bg: "bg-support/15",
    ring: "ring-1 ring-support/30",
  },
  error: {
    dot: "bg-red-400",
    text: "text-red-300",
    bg: "bg-red-500/15",
    ring: "ring-1 ring-red-400/30",
  },
};

export function Banner({
  kind = "info",
  children,
  autoDismissMs = 6000,
}: {
  kind?: Kind;
  children: React.ReactNode;
  autoDismissMs?: number;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!autoDismissMs) return;
    const t = setTimeout(() => setOpen(false), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs]);

  if (!open) return null;

  const s = kindClass[kind];

  return (
    <div
      role="status"
      className={`mb-5 flex items-start justify-between gap-3 rounded-card px-4 py-3 text-[13px] backdrop-blur-sm ${s.bg} ${s.text} ${s.ring}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`}
        />
        <div className="text-ink-on-page/80 [&_strong]:text-ink-on-page">{children}</div>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
        className="text-ink-on-page/50 transition-opacity hover:text-ink-on-page"
      >
        ×
      </button>
    </div>
  );
}

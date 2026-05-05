"use client";

import { useEffect, useState } from "react";

type Kind = "success" | "info" | "error";

const kindClass: Record<Kind, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-neutral-200 bg-neutral-50 text-neutral-800",
  error: "border-red-200 bg-red-50 text-red-800",
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

  return (
    <div
      role="status"
      className={`mb-4 flex items-start justify-between gap-3 rounded border px-4 py-2.5 text-sm ${kindClass[kind]}`}
    >
      <div>{children}</div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
        className="text-current opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

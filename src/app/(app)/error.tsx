"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
        Something went wrong
      </span>
      <h1 className="h-display-sm text-ink-on-page">
        We hit an <span className="italic text-support">error.</span>
      </h1>
      <p className="max-w-md text-[13.5px] text-ink-on-page/55">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-ink-on-page/15 bg-ink-on-page/5 px-4 py-1.5 text-[13px] font-medium text-ink-on-page/80 transition-colors hover:bg-ink-on-page/10 hover:text-ink-on-page"
      >
        Try again
      </button>
    </div>
  );
}

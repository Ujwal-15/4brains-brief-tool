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
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm uppercase tracking-wide text-red-600">
        Something went wrong
      </p>
      <h1 className="text-xl font-semibold tracking-tight">
        We hit an error rendering this page.
      </h1>
      <p className="max-w-md text-sm text-neutral-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
      >
        Try again
      </button>
    </div>
  );
}

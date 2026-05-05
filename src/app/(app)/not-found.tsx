import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm uppercase tracking-wide text-neutral-500">
        Not found
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        We couldn’t find that brief.
      </h1>
      <p className="max-w-sm text-sm text-neutral-600">
        It may have been deleted or you may not have access. Try heading back to
        the dashboard.
      </p>
      <Link
        href="/"
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

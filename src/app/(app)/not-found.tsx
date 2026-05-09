import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <span className="eyebrow">Not found</span>
      <h1 className="h-display-sm text-ink-on-page">
        We couldn’t find{" "}
        <span className="italic text-support">that brief.</span>
      </h1>
      <p className="max-w-sm text-[13.5px] text-ink-on-page/55">
        It may have been deleted or you may not have access. Try heading back to
        the dashboard.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-white shadow-glow-primary transition-all hover:-translate-y-px hover:bg-primary-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

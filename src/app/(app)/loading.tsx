export default function Loading() {
  return (
    <div className="flex items-center gap-2 py-12 text-sm text-neutral-500">
      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      Loading…
    </div>
  );
}

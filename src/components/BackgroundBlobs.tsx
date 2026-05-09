// Decorative drifting gradient blobs sitting behind every page on the dark
// navy base. Higher opacity than the cream-base version because brand
// colors GLOW on dark and we want them visible without being garish.
//
// Pure visuals — no interactivity, ignores reduced-motion via CSS.
export function BackgroundBlobs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Primary blob — top-left, the brand's signature blue */}
      <div className="absolute -left-40 -top-48 h-[640px] w-[640px] rounded-full bg-primary/[0.22] blur-3xl bg-blob-1" />
      {/* Support cyan blob — right side, mid */}
      <div className="absolute -right-44 top-1/4 h-[680px] w-[680px] rounded-full bg-support/[0.18] blur-3xl bg-blob-2" />
      {/* Secondary green blob — bottom-left */}
      <div className="absolute -bottom-56 left-1/4 h-[580px] w-[580px] rounded-full bg-secondary/[0.14] blur-3xl bg-blob-3" />
      {/* Warm primary glow — top-right */}
      <div className="absolute right-1/4 -top-24 h-[460px] w-[460px] rounded-full bg-primary/[0.10] blur-3xl bg-blob-4" />
    </div>
  );
}

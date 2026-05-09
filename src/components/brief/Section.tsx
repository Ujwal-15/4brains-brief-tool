"use client";

type Props = {
  index: number;
  title: string;
  open: boolean;
  complete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

// Each section renders as an elevated card on the cream background.
// Header is a tappable row with a big serif italic index numeral, the title,
// and a chevron. Clicking expands the section.
export function Section({
  index,
  title,
  open,
  complete,
  onToggle,
  children,
}: Props) {
  return (
    <section className="overflow-hidden rounded-card bg-surface shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 px-7 py-5 text-left transition-colors hover:bg-surface-alt/60 ${
          open ? "border-b border-black/[0.06]" : ""
        }`}
      >
        <div className="flex items-baseline gap-4">
          <span
            className={`font-display text-[22px] italic font-bold leading-none tabular-nums ${
              complete ? "text-secondary" : "text-ink-soft/55"
            }`}
            aria-label={complete ? "Section complete" : "Section incomplete"}
          >
            {complete ? "✓" : String(index).padStart(2, "0")}
          </span>
          <h2 className="text-[15.5px] font-medium tracking-tight text-ink">
            {title}
          </h2>
        </div>
        <span
          aria-hidden
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt/80 text-[10px] text-ink-soft transition-all ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {open && <div className="px-7 py-7">{children}</div>}
    </section>
  );
}

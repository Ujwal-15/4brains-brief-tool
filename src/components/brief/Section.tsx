"use client";

type Props = {
  index: number;
  title: string;
  open: boolean;
  complete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function Section({
  index,
  title,
  open,
  complete,
  onToggle,
  children,
}: Props) {
  return (
    <section className="overflow-hidden rounded border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-neutral-50"
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              complete
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
            aria-label={complete ? "Section complete" : "Section incomplete"}
          >
            {complete ? "✓" : index}
          </span>
          <span className="text-sm font-medium text-neutral-900">{title}</span>
        </div>
        <span
          aria-hidden
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-neutral-200 px-4 py-5">{children}</div>
      )}
    </section>
  );
}

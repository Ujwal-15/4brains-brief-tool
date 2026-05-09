"use client";

import { useEffect } from "react";

// Modal that pops the moment Export finishes. Confirms the export went
// through, tells the user how many flowcharts ended up in the PDF, and
// gives them a button to re-trigger the download if their browser
// suppressed the auto-download.
//
// Share buttons (email / WhatsApp / copy link) intentionally NOT here —
// the team forwards PDFs through their own existing channels.

type Props = {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  pdfName: string;
  projectName: string;
  flowchartCount: number;
  totalActivities: number;
};

export function PostExportModal({
  open,
  onClose,
  pdfUrl,
  pdfName,
  projectName,
  flowchartCount,
  totalActivities,
}: Props) {
  // ESC closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-export-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-12 pt-24 backdrop-blur-sm sm:items-center sm:pb-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hero-panel relative w-full max-w-md overflow-hidden rounded-hero p-7 shadow-elevated ring-1 ring-ink-on-page/[0.08] sm:p-9"
      >
        <div className="relative space-y-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-[14px] text-secondary"
            >
              ✓
            </span>
            <span className="eyebrow">Exported</span>
          </div>

          {/* Title + summary */}
          <div className="space-y-2">
            <h2
              id="post-export-title"
              className="font-sans text-[24px] font-medium leading-tight tracking-tightest text-ink-on-page"
            >
              {projectName}{" "}
              <span className="font-display italic font-bold text-italic-tone">
                shipped.
              </span>
            </h2>
            <p className="text-[13px] text-ink-on-page/65">
              {flowchartCount > 0 ? (
                <>
                  PDF includes{" "}
                  <span className="font-medium text-ink-on-page">
                    {flowchartCount} flowchart
                    {flowchartCount === 1 ? "" : "s"}
                  </span>{" "}
                  across {totalActivities} activit
                  {totalActivities === 1 ? "y" : "ies"}.
                </>
              ) : (
                <>
                  PDF generated for {totalActivities} activit
                  {totalActivities === 1 ? "y" : "ies"}.{" "}
                  <span className="text-champagne">
                    Flowcharts didn’t render — open the browser console for the
                    reason.
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Primary download */}
          <a
            href={pdfUrl}
            download={pdfName}
            className="flex items-center justify-between gap-3 rounded-card bg-primary px-5 py-3 text-white shadow-glow-primary transition-transform hover:-translate-y-px"
          >
            <span>
              <div className="text-[13px] font-medium">Download PDF</div>
              <div className="text-[11px] text-white/80">{pdfName}</div>
            </span>
            <span aria-hidden className="text-lg">⤓</span>
          </a>

          {/* Close */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink-on-page/15 bg-ink-on-page/5 px-4 py-1.5 text-[13px] font-medium text-ink-on-page/80 transition-colors hover:bg-ink-on-page/10 hover:text-ink-on-page"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  type BriefFormData,
  EMPTY_BRIEF,
  TOTAL_REQUIRED_SECTIONS,
  completedSectionCount,
  getMissingRequiredFields,
  isSection1Complete,
  isSection2Complete,
  isSection3Complete,
  isSection4Complete,
  isSection5Complete,
  isSection6Complete,
} from "@/lib/briefSchema";
import {
  buildFlowchartPngsForActivities,
  postExport,
  triggerDownload,
} from "@/lib/clientExport";
import { Section } from "./Section";
import { Section1 } from "./sections/Section1";
import { Section2 } from "./sections/Section2";
import { Section3 } from "./sections/Section3";
import { Section4 } from "./sections/Section4";
import { Section5 } from "./sections/Section5";
import { Section6 } from "./sections/Section6";
import { PostExportModal } from "./PostExportModal";

const AUTO_SAVE_INTERVAL_MS = 30_000;

const SECTION_META: { index: number; title: string }[] = [
  { index: 1, title: "Project & Client Info" },
  { index: 2, title: "Event Schedule & Venue" },
  { index: 3, title: "Activities" },
  { index: 4, title: "Design & Branding" },
  { index: 5, title: "Fabrication & On-site" },
  { index: 6, title: "Additional Notes" },
];

export function BriefForm({
  briefId: initialBriefId,
  initialData,
}: {
  briefId?: string;
  initialData?: BriefFormData;
}) {
  const router = useRouter();
  const startingValues = initialData ?? EMPTY_BRIEF;
  const isEdit = !!initialBriefId;

  const methods = useForm<BriefFormData>({
    defaultValues: startingValues,
    mode: "onBlur",
  });

  const { control, getValues, setError, clearErrors, formState } = methods;
  const values = useWatch({ control }) as BriefFormData;

  const [openSections, setOpenSections] = useState<Record<number, boolean>>(
    () => Object.fromEntries(SECTION_META.map((s) => [s.index, s.index === 1])),
  );
  const [openActivities, setOpenActivities] = useState<Record<number, boolean>>(
    { 0: true },
  );
  const [briefId, setBriefId] = useState<string | null>(initialBriefId ?? null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    pdfUrl: string;
    pdfName: string;
    flowchartCount: number;
    totalActivities: number;
    projectName: string;
  } | null>(null);

  const dirtyRef = useRef(false);
  const lastSavedSnapshot = useRef<string>(JSON.stringify(startingValues));
  const briefIdRef = useRef<string | null>(initialBriefId ?? null);

  useEffect(() => {
    briefIdRef.current = briefId;
  }, [briefId]);

  useEffect(() => {
    const current = JSON.stringify(values);
    if (current !== lastSavedSnapshot.current) dirtyRef.current = true;
  }, [values]);

  // Clear validation errors as the user fills in offending fields.
  useEffect(() => {
    const errored = Object.keys(formState.errors);
    if (errored.length === 0) return;
    errored.forEach((key) => {
      // Errors may be set on nested paths like activities.0.userJourney —
      // the RHF errors object stores them at the top-level key for flat
      // fields and as nested objects for arrays. The resolved value via
      // getValues() with the path works either way.
      const v = methods.getValues(key as never) as unknown;
      const f = Array.isArray(v)
        ? v.length > 0
        : typeof v === "string"
          ? v.trim().length > 0
          : false;
      if (f) clearErrors(key as never);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const [, setNowTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  async function persist(payload: {
    data: string;
    status?: string;
  }): Promise<{ id: string } | null> {
    if (briefIdRef.current) {
      const res = await fetch(`/api/briefs/${briefIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return { id: briefIdRef.current };
    } else {
      const res = await fetch(`/api/briefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload.data }),
      });
      if (!res.ok) return null;
      const created = (await res.json()) as { id: string };
      setBriefId(created.id);
      if (payload.status) {
        await fetch(`/api/briefs/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: payload.status }),
        });
      }
      return created;
    }
  }

  async function autoSave() {
    if (!dirtyRef.current || saveState === "saving") return;
    setSaveState("saving");
    const snapshot = JSON.stringify(getValues());
    const result = await persist({ data: snapshot });
    if (result) {
      lastSavedSnapshot.current = snapshot;
      dirtyRef.current = false;
      setSavedAt(new Date());
      setSaveState("idle");
    } else {
      setSaveState("error");
    }
  }

  useEffect(() => {
    const t = setInterval(() => {
      void autoSave();
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyValidation(): boolean {
    clearErrors();
    const v = getValues();
    const missing = getMissingRequiredFields(v);
    if (missing.length === 0) return false;

    missing.forEach((m) => {
      setError(m.name as never, { type: "required", message: "Required" });
    });

    const first = missing[0];
    setOpenSections((s) => ({ ...s, [first.section]: true }));
    if (first.activityIndex !== undefined) {
      setOpenActivities((s) => ({ ...s, [first.activityIndex!]: true }));
    }

    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-field="${cssEscape(first.name)}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector<HTMLElement>(
          'input,textarea,select,button[role="switch"]',
        );
        input?.focus();
      }
    });

    return true;
  }

  async function saveDraft() {
    setSubmitting(true);
    setSaveState("saving");
    const snapshot = JSON.stringify(getValues());
    const result = await persist({ data: snapshot, status: "DRAFT" });
    if (result) {
      lastSavedSnapshot.current = snapshot;
      dirtyRef.current = false;
      setSavedAt(new Date());
      setSaveState("idle");
      router.push(isEdit ? `/briefs/${result.id}?saved=1` : "/?saved=1");
    } else {
      setSaveState("error");
    }
    setSubmitting(false);
  }

  async function exportPdf() {
    if (applyValidation()) return;
    setSubmitting(true);
    setSaveState("saving");
    const v = getValues();
    const snapshot = JSON.stringify(v);
    const saved = await persist({ data: snapshot });
    if (!saved) {
      setSaveState("error");
      setSubmitting(false);
      return;
    }
    lastSavedSnapshot.current = snapshot;
    dirtyRef.current = false;
    setSavedAt(new Date());
    setSaveState("idle");

    // Render one flowchart PNG per activity (skipping any with no journey).
    // These get embedded inline inside the PDF below — single-file output.
    let flowcharts: Map<number, Blob> = new Map();
    try {
      flowcharts = await buildFlowchartPngsForActivities(v.activities);
    } catch (err) {
      console.warn("Flowchart render failed, exporting PDF without charts", err);
    }

    const result = await postExport(saved.id, flowcharts);
    if (!result.ok) {
      alert(result.error || "Export failed");
      setSubmitting(false);
      return;
    }

    // Auto-trigger the download AND show the modal so the user can grab
    // the PDF or jump straight into Share. No redirect — user stays on
    // the form, lands in the modal, picks their next action.
    triggerDownload(result.data.pdfUrl, result.data.pdfName);
    setExportResult({
      pdfUrl: result.data.pdfUrl,
      pdfName: result.data.pdfName,
      flowchartCount: result.data.flowchartCount,
      totalActivities: v.activities.length,
      projectName: v.projectName || "Untitled brief",
    });
    setSubmitting(false);
  }

  const completed = completedSectionCount(values);
  const errorCount = Object.keys(formState.errors).length;

  const toggleSection = (idx: number) =>
    setOpenSections((s) => ({ ...s, [idx]: !s[idx] }));

  const sectionCompleteFns: Record<number, (v: BriefFormData) => boolean> = {
    1: isSection1Complete,
    2: isSection2Complete,
    3: isSection3Complete,
    4: isSection4Complete,
    5: isSection5Complete,
    6: isSection6Complete,
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5 pb-32">
        <div className="space-y-2 pb-2">
          <div className="eyebrow">
            {isEdit ? "Editing" : "New brief"}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="h-display-sm text-ink-on-page">
              {isEdit ? (
                <>
                  Refine the <span className="italic text-support">brief.</span>
                </>
              ) : (
                <>
                  A new brief, <span className="italic text-support">begun.</span>
                </>
              )}
            </h1>
            <p className="text-[12px] text-ink-on-page/50">
              Auto-saves every 30 seconds.
            </p>
          </div>
        </div>

        {SECTION_META.map((s) => (
          <Section
            key={s.index}
            index={s.index}
            title={s.title}
            open={!!openSections[s.index]}
            complete={sectionCompleteFns[s.index](values)}
            onToggle={() => toggleSection(s.index)}
          >
            {renderSectionBody(s.index, openActivities, setOpenActivities)}
          </Section>
        ))}
      </form>

      <StickyBar
        completed={completed}
        total={TOTAL_REQUIRED_SECTIONS}
        savedAt={savedAt}
        saveState={saveState}
        submitting={submitting}
        errorCount={errorCount}
        onSaveDraft={saveDraft}
        onExport={exportPdf}
      />

      <PostExportModal
        open={exportResult !== null}
        onClose={() => setExportResult(null)}
        pdfUrl={exportResult?.pdfUrl ?? ""}
        pdfName={exportResult?.pdfName ?? ""}
        projectName={exportResult?.projectName ?? ""}
        flowchartCount={exportResult?.flowchartCount ?? 0}
        totalActivities={exportResult?.totalActivities ?? 0}
      />
    </FormProvider>
  );
}

function renderSectionBody(
  idx: number,
  openActivities: Record<number, boolean>,
  setOpenActivities: (next: Record<number, boolean>) => void,
) {
  switch (idx) {
    case 1:
      return <Section1 />;
    case 2:
      return <Section2 />;
    case 3:
      return (
        <Section3 openMap={openActivities} setOpenMap={setOpenActivities} />
      );
    case 4:
      return <Section4 />;
    case 5:
      return <Section5 />;
    case 6:
      return <Section6 />;
    default:
      return null;
  }
}

// CSS.escape polyfill — `activities.0.userJourney` contains dots which
// break attribute selectors unless escaped.
function cssEscape(s: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(s);
  }
  return s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}

function StickyBar({
  completed,
  total,
  savedAt,
  saveState,
  submitting,
  errorCount,
  onSaveDraft,
  onExport,
}: {
  completed: number;
  total: number;
  savedAt: Date | null;
  saveState: "idle" | "saving" | "error";
  submitting: boolean;
  errorCount: number;
  onSaveDraft: () => void;
  onExport: () => void;
}) {
  const pct = Math.round((completed / Math.max(total, 1)) * 100);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-page/85 backdrop-blur-xl">
      <div aria-hidden className="brand-line" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-on-page/60">
          <span className="flex items-center gap-2.5">
            <span className="relative h-1 w-24 overflow-hidden rounded-full bg-ink-on-page/10">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-support transition-all"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span>
              <span className="font-semibold text-ink-on-page">{completed}</span>
              <span className="text-ink-on-page/55"> / {total} sections</span>
            </span>
          </span>
          <span aria-hidden className="text-ink-on-page/25">·</span>
          <SaveStatus saveState={saveState} savedAt={savedAt} />
          {errorCount > 0 && (
            <>
              <span aria-hidden className="text-ink-on-page/25">·</span>
              <span className="text-red-400">
                {errorCount} field{errorCount === 1 ? "" : "s"} need attention
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Secondary: Save Draft */}
          <button
            type="button"
            disabled={submitting}
            onClick={onSaveDraft}
            className="rounded-full border border-ink-on-page/15 bg-ink-on-page/5 px-4 py-1.5 text-[13px] font-medium text-ink-on-page/80 transition-colors hover:bg-ink-on-page/10 hover:text-ink-on-page disabled:opacity-60"
          >
            Save Draft
          </button>
          {/* Primary: Export */}
          <button
            type="button"
            disabled={submitting}
            onClick={onExport}
            className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-white shadow-glow-primary transition-all hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({
  saveState,
  savedAt,
}: {
  saveState: "idle" | "saving" | "error";
  savedAt: Date | null;
}) {
  if (saveState === "saving") return <span className="text-ink-on-page/70">Saving…</span>;
  if (saveState === "error")
    return <span className="text-red-400">Save failed</span>;
  if (!savedAt)
    return <span className="text-ink-on-page/40">Not saved yet</span>;
  return <span className="text-ink-on-page/70">Draft saved · {relativeTime(savedAt)}</span>;
}

function relativeTime(d: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

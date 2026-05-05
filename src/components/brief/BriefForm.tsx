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
  isSection7Complete,
  isSection8Complete,
  isSection9Complete,
  isSection10Complete,
  isSection11Complete,
} from "@/lib/briefSchema";
import {
  buildFlowchartPng,
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
import { Section7 } from "./sections/Section7";
import { Section8 } from "./sections/Section8";
import { Section9 } from "./sections/Section9";
import { Section10 } from "./sections/Section10";
import { Section11 } from "./sections/Section11";

type PMOption = { id: string; name: string; email: string };

const AUTO_SAVE_INTERVAL_MS = 30_000;

const SECTION_META: { index: number; title: string }[] = [
  { index: 1, title: "Project & Client Info" },
  { index: 2, title: "Event Schedule & Venue" },
  { index: 3, title: "Activity Overview" },
  { index: 4, title: "User Journey" },
  { index: 5, title: "Client Requirements" },
  { index: 6, title: "Design & Branding" },
  { index: 7, title: "Data & Personalization" },
  { index: 8, title: "Fabrication & On-site" },
  { index: 9, title: "Deliverables" },
  { index: 10, title: "Timeline" },
  { index: 11, title: "Additional Notes" },
];

export function BriefForm({
  pmOptions,
  briefId: initialBriefId,
  initialData,
}: {
  pmOptions: PMOption[];
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
  const [briefId, setBriefId] = useState<string | null>(initialBriefId ?? null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [submitting, setSubmitting] = useState(false);

  const dirtyRef = useRef(false);
  const lastSavedSnapshot = useRef<string>(JSON.stringify(startingValues));
  const briefIdRef = useRef<string | null>(initialBriefId ?? null);

  useEffect(() => {
    briefIdRef.current = briefId;
  }, [briefId]);

  // Mark dirty when current values diverge from the last saved snapshot.
  useEffect(() => {
    const current = JSON.stringify(values);
    if (current !== lastSavedSnapshot.current) dirtyRef.current = true;
  }, [values]);

  // Clear validation errors as the user fills in the offending fields.
  useEffect(() => {
    const errored = Object.keys(formState.errors);
    if (errored.length === 0) return;
    errored.forEach((key) => {
      const v = values[key as keyof BriefFormData];
      const filled = Array.isArray(v)
        ? v.length > 0
        : typeof v === "string"
          ? v.trim().length > 0
          : false;
      if (filled) clearErrors(key as keyof BriefFormData);
    });
    // We intentionally read formState.errors without subscribing; re-run on
    // values changes only — that's what triggers the "did this fix it?" check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  // Tick a clock so "Xm ago" updates every minute.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  async function persist(payload: {
    data: string;
    status?: string;
    pmId?: string | null;
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
      if (payload.status || payload.pmId !== undefined) {
        await fetch(`/api/briefs/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: payload.status,
            pmId: payload.pmId,
          }),
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

  // Set RHF errors for missing required fields, open the offending section,
  // scroll the first one into view, and focus its input. Returns true if the
  // form has any validation errors.
  function applyValidation(): boolean {
    clearErrors();
    const v = getValues();
    const missing = getMissingRequiredFields(v);
    if (missing.length === 0) return false;

    missing.forEach((m) => {
      setError(m.name, { type: "required", message: "Required" });
    });

    const first = missing[0];
    setOpenSections((s) => ({ ...s, [first.section]: true }));

    // Defer to next frame so the section actually expands before scrolling.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-field="${first.name}"]`,
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
    const v = getValues();
    const result = await persist({
      data: snapshot,
      status: "DRAFT",
      pmId: v.pmId || null,
    });
    if (result) {
      lastSavedSnapshot.current = snapshot;
      dirtyRef.current = false;
      setSavedAt(new Date());
      setSaveState("idle");
      // Edit mode: back to detail. New: back to dashboard.
      router.push(isEdit ? `/briefs/${result.id}?saved=1` : "/?saved=1");
    } else {
      setSaveState("error");
    }
    setSubmitting(false);
  }

  async function sendToPM() {
    if (applyValidation()) return; // errors set + scrolled to first

    const v = getValues();
    setSubmitting(true);
    setSaveState("saving");
    const snapshot = JSON.stringify(v);
    const result = await persist({
      data: snapshot,
      status: "IN_REVIEW",
      pmId: v.pmId,
    });
    if (result) {
      lastSavedSnapshot.current = snapshot;
      dirtyRef.current = false;
      setSavedAt(new Date());
      setSaveState("idle");
      router.push("/?sent=1");
    } else {
      setSaveState("error");
    }
    setSubmitting(false);
  }

  async function exportPdf() {
    if (applyValidation()) return;

    setSubmitting(true);
    setSaveState("saving");

    // 1. Force-save the latest data so the server-side export reads fresh
    //    state. This also creates the brief if it doesn't exist yet.
    const v = getValues();
    const snapshot = JSON.stringify(v);
    const saved = await persist({ data: snapshot, pmId: v.pmId || null });
    if (!saved) {
      setSaveState("error");
      setSubmitting(false);
      return;
    }
    lastSavedSnapshot.current = snapshot;
    dirtyRef.current = false;
    setSavedAt(new Date());
    setSaveState("idle");

    // 2. Render Mermaid PNG client-side. Skip silently if it fails — the PDF
    //    can still ship without an embedded flowchart.
    let png: Blob | null = null;
    try {
      png = await buildFlowchartPng(v.userJourney);
    } catch (err) {
      console.warn("Flowchart render failed, exporting PDF only", err);
    }

    // 3. Hit the server export endpoint.
    const result = await postExport(saved.id, png);
    if (!result.ok) {
      alert(result.error || "Export failed");
      setSubmitting(false);
      return;
    }

    // 4. Trigger ZIP download, then return to dashboard.
    triggerDownload(result.data.zipUrl, result.data.zipName);
    router.push("/?exported=1");
    setSubmitting(false);
  }

  const completed = completedSectionCount(values);
  const errorCount = Object.keys(formState.errors).length;

  const toggle = (idx: number) =>
    setOpenSections((s) => ({ ...s, [idx]: !s[idx] }));

  const sectionCompleteFns: Record<number, (v: BriefFormData) => boolean> = {
    1: isSection1Complete,
    2: isSection2Complete,
    3: isSection3Complete,
    4: isSection4Complete,
    5: isSection5Complete,
    6: isSection6Complete,
    7: isSection7Complete,
    8: isSection8Complete,
    9: isSection9Complete,
    10: isSection10Complete,
    11: isSection11Complete,
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pb-32">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit Brief" : "New Brief"}
          </h1>
          <p className="text-xs text-neutral-500">
            Auto-saves every 30 seconds.
          </p>
        </div>

        {SECTION_META.map((s) => (
          <Section
            key={s.index}
            index={s.index}
            title={s.title}
            open={!!openSections[s.index]}
            complete={sectionCompleteFns[s.index](values)}
            onToggle={() => toggle(s.index)}
          >
            {renderSectionBody(s.index, pmOptions)}
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
        onSendToPM={sendToPM}
        onExport={exportPdf}
      />
    </FormProvider>
  );
}

function renderSectionBody(idx: number, pmOptions: PMOption[]) {
  switch (idx) {
    case 1:
      return <Section1 pmOptions={pmOptions} />;
    case 2:
      return <Section2 />;
    case 3:
      return <Section3 />;
    case 4:
      return <Section4 />;
    case 5:
      return <Section5 />;
    case 6:
      return <Section6 />;
    case 7:
      return <Section7 />;
    case 8:
      return <Section8 />;
    case 9:
      return <Section9 />;
    case 10:
      return <Section10 />;
    case 11:
      return <Section11 />;
    default:
      return null;
  }
}

function StickyBar({
  completed,
  total,
  savedAt,
  saveState,
  submitting,
  errorCount,
  onSaveDraft,
  onSendToPM,
  onExport,
}: {
  completed: number;
  total: number;
  savedAt: Date | null;
  saveState: "idle" | "saving" | "error";
  submitting: boolean;
  errorCount: number;
  onSaveDraft: () => void;
  onSendToPM: () => void;
  onExport: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
          <span>
            <span className="font-semibold text-neutral-900">{completed}</span>
            <span> of {total} sections complete</span>
          </span>
          <span aria-hidden className="text-neutral-300">
            ·
          </span>
          <SaveStatus saveState={saveState} savedAt={savedAt} />
          {errorCount > 0 && (
            <>
              <span aria-hidden className="text-neutral-300">
                ·
              </span>
              <span className="text-red-600">
                {errorCount} field{errorCount === 1 ? "" : "s"} need attention
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onSaveDraft}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100 disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onSendToPM}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            Send to PM
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onExport}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Export PDF + Flowchart
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
  if (saveState === "saving") return <span>Saving…</span>;
  if (saveState === "error")
    return <span className="text-red-600">Save failed</span>;
  if (!savedAt) return <span className="text-neutral-400">Not saved yet</span>;
  return <span>Draft saved · {relativeTime(savedAt)}</span>;
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

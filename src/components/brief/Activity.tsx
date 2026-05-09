"use client";

import { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CUSTOM_PRODUCT_ID } from "@/lib/catalog";
import type {
  Activity as ActivityType,
  BriefFormData,
} from "@/lib/briefSchema";
import {
  COMMUNICATION_FLOWS,
  DATA_FORMATS,
  activityCategory,
  activityDisplayName,
  isActivityComplete,
} from "@/lib/briefSchema";
import { generateFlowchart } from "@/lib/flowchart";
import { Field, ToggleRow, inputClass, textareaClass } from "./Field";
import { MermaidPreview } from "./MermaidPreview";
import { ActivityPicker } from "./ActivityPicker";
import { EditableChips } from "./EditableChips";

type Props = {
  index: number;
  open: boolean;
  onToggle: () => void;
  onRemove?: () => void;
};

export function Activity({ index, open, onToggle, onRemove }: Props) {
  const { register, control, setValue } = useFormContext<BriefFormData>();
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [sparseHint, setSparseHint] = useState(false);
  const a = useWatch({
    control,
    name: `activities.${index}`,
  }) as ActivityType | undefined;

  const journey = a?.userJourney ?? "";
  const aiFlowchart = a?.aiFlowchart ?? "";

  // Live preview source: prefer the AI-generated Mermaid (set by Suggest),
  // fall back to the keyword classifier rendering of the typed journey text.
  // Debounced 300ms so we don't re-render on every keystroke.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      if (aiFlowchart) {
        setDebounced(aiFlowchart);
      } else {
        setDebounced(generateFlowchart(journey || ""));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [journey, aiFlowchart]);

  const safe: ActivityType = a ?? ({} as ActivityType);
  const complete = a ? isActivityComplete(a) : false;
  const displayName = a ? activityDisplayName(a) : "";

  const path = (field: keyof ActivityType) =>
    `activities.${index}.${field}` as const;

  return (
    <section className="overflow-hidden rounded-card bg-surface-alt/70 shadow-hairline">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
              complete
                ? "bg-secondary text-white shadow-soft"
                : "bg-white text-ink-soft shadow-hairline"
            }`}
            aria-label={complete ? "Activity complete" : "Activity incomplete"}
          >
            {complete ? "✓" : index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-medium text-ink">
              Activity {index + 1}
              {displayName && (
                <span className="font-normal text-ink-soft">
                  {" "}
                  — {displayName}
                </span>
              )}
            </div>
            {!open && safe.stationCount && (
              <div className="truncate text-[12px] text-ink-soft/80">
                {safe.stationCount} station
                {safe.stationCount === "1" ? "" : "s"}
              </div>
            )}
          </div>
          <span
            aria-hidden
            className={`text-ink-soft/60 transition-transform ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[12px] text-ink-soft/70 transition-colors hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-6 border-t border-black/[0.06] bg-surface px-5 py-6">
          <ActivityPicker index={index} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Number of stations / units"
              required
              name={path("stationCount")}
            >
              <input
                type="number"
                min={1}
                className={inputClass}
                {...register(path("stationCount"))}
              />
            </Field>
            <Field
              label="Custom label"
              name={path("customLabel")}
              hint="Optional — overrides the activity name (e.g. ‘Slot 1 Reg Desk’)"
            >
              <input
                className={inputClass}
                {...register(path("customLabel"))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Description"
                name={path("description")}
                hint="Optional — anything beyond the catalog defaults"
              >
                <textarea
                  className={textareaClass}
                  {...register(path("description"))}
                />
              </Field>
            </div>
          </div>

          {/* User journey + AI suggest + auto flowchart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80">
                User Journey <span className="ml-0.5 text-primary">*</span>
              </span>
              <button
                type="button"
                disabled={
                  suggesting ||
                  !safe.productId ||
                  (safe.productId === CUSTOM_PRODUCT_ID &&
                    !safe.customProductName?.trim())
                }
                onClick={async () => {
                  setSuggestError(null);
                  setSparseHint(false);
                  setSuggesting(true);
                  try {
                    const res = await fetch(`/api/briefs/suggest`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: safe.productId,
                        customProductName: safe.customProductName || "",
                        customLabel: safe.customLabel || "",
                        description: safe.description || "",
                        communicationFlows: safe.communicationFlows ?? [],
                        userDataCaptured: Boolean(safe.userDataCaptured),
                        dataFields: safe.dataFields || "",
                        dataSharedBack: safe.dataSharedBack || "",
                        clientProvidesData: Boolean(safe.clientProvidesData),
                        dataFormat: safe.dataFormat || "",
                        dataNotes: safe.dataNotes || "",
                        fourBrainsDeliverables: safe.fourBrainsDeliverables ?? [],
                        clientDeliverables: safe.clientDeliverables ?? [],
                      }),
                    });
                    if (!res.ok) {
                      const payload = (await res.json().catch(() => ({}))) as {
                        error?: string;
                      };
                      throw new Error(payload.error || `HTTP ${res.status}`);
                    }
                    const data = (await res.json()) as {
                      journey: string;
                      flowchart: string;
                      userDataCaptured?: boolean;
                      dataFields?: string;
                      dataSharedBack?: string;
                      clientProvidesData?: boolean;
                      dataFormat?: string;
                      dataNotes?: string;
                      communicationFlows?: string[];
                      specNotes?: string;
                    };
                    setValue(path("userJourney"), data.journey, {
                      shouldDirty: true,
                    });
                    setValue(path("aiFlowchart"), data.flowchart, {
                      shouldDirty: true,
                    });

                    // Auto-fill any fields the LLM confidently inferred from
                    // the description. Only overrides when LLM returned a
                    // value — otherwise leaves the user's existing entry.
                    if (typeof data.userDataCaptured === "boolean")
                      setValue(
                        path("userDataCaptured"),
                        data.userDataCaptured,
                        { shouldDirty: true },
                      );
                    if (data.dataFields)
                      setValue(path("dataFields"), data.dataFields, {
                        shouldDirty: true,
                      });
                    if (data.dataSharedBack)
                      setValue(path("dataSharedBack"), data.dataSharedBack, {
                        shouldDirty: true,
                      });
                    if (typeof data.clientProvidesData === "boolean")
                      setValue(
                        path("clientProvidesData"),
                        data.clientProvidesData,
                        { shouldDirty: true },
                      );
                    if (data.dataFormat)
                      setValue(path("dataFormat"), data.dataFormat, {
                        shouldDirty: true,
                      });
                    if (data.dataNotes)
                      setValue(path("dataNotes"), data.dataNotes, {
                        shouldDirty: true,
                      });
                    if (
                      Array.isArray(data.communicationFlows) &&
                      data.communicationFlows.length > 0
                    )
                      setValue(
                        path("communicationFlows"),
                        data.communicationFlows,
                        { shouldDirty: true },
                      );
                    if (data.specNotes)
                      setValue(path("specNotes"), data.specNotes, {
                        shouldDirty: true,
                      });

                    // Sparse-description nudge: if the user fired Suggest with
                    // little-to-no description, the LLM is essentially guessing
                    // from the catalog name. Surface a hint so they know they
                    // can get better drafts by feeding it more context.
                    const wordCount = (safe.description || "")
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length;
                    setSparseHint(wordCount < 15);
                  } catch (err) {
                    setSuggestError(
                      err instanceof Error
                        ? err.message
                        : "Suggestion failed",
                    );
                  } finally {
                    setSuggesting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-support to-primary/80 px-3 py-1.5 text-[12px] font-medium text-white shadow-soft transition-all hover:-translate-y-px hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                title={
                  !safe.productId
                    ? "Pick an activity first"
                    : "Generate a draft journey using AI"
                }
              >
                <span aria-hidden>✨</span>
                <span>{suggesting ? "Drafting…" : "Suggest draft"}</span>
              </button>
            </div>
            <Field
              label=""
              name={path("userJourney")}
              hint="One step per line. Click ✨ Suggest draft for a starting point."
            >
              <textarea
                className={`${textareaClass} min-h-[140px] font-mono`}
                placeholder={JOURNEY_PLACEHOLDER}
                {...register(path("userJourney"))}
              />
            </Field>
            {suggestError && (
              <p className="text-xs text-red-600">
                Couldn’t generate: {suggestError}
              </p>
            )}
            {sparseHint && !suggestError && (
              <div className="rounded-card bg-support/[0.06] px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-soft shadow-hairline">
                <span className="font-semibold text-support">Tip ·</span> add a
                couple of sentences in{" "}
                <span className="italic text-ink">Description</span> above
                (slot timing, key constraints, who the user is) and click{" "}
                <span className="font-medium text-ink">Suggest draft</span>{" "}
                again — the AI will tailor the journey instead of guessing from
                the catalog name.
              </div>
            )}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
                Flowchart preview
              </div>
              <MermaidPreview source={debounced} />
            </div>
          </div>

          {/* Communication flow — only shown for Registration-category
              activities (which is where invitation flows actually apply). */}
          {a && activityCategory(a) === "Registration" && (
            <Field
              label="Communication / Invite Flow"
              name={path("communicationFlows")}
              hint="Pick all that apply"
            >
              <Controller
                control={control}
                name={path("communicationFlows")}
                render={({ field }) => (
                  <EditableChips
                    options={COMMUNICATION_FLOWS as unknown as string[]}
                    value={(field.value as string[]) ?? []}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          )}

          {/* Deliverables — chips, prefilled from catalog on pick, editable. */}
          <div className="space-y-4 border-t border-black/[0.06] pt-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
              Deliverables
            </div>
            <Field
              label="What 4Brains will provide"
              name={path("fourBrainsDeliverables")}
              hint="Pre-filled from the catalog on pick. Edit / add / remove freely."
            >
              <Controller
                control={control}
                name={path("fourBrainsDeliverables")}
                render={({ field }) => (
                  <EditableChips
                    value={(field.value as string[]) ?? []}
                    onChange={field.onChange}
                    addPlaceholder="Add an item…"
                  />
                )}
              />
            </Field>
            <Field
              label="What client will provide"
              name={path("clientDeliverables")}
              hint="Pre-filled from the catalog on pick. Edit / add / remove freely."
            >
              <Controller
                control={control}
                name={path("clientDeliverables")}
                render={({ field }) => (
                  <EditableChips
                    value={(field.value as string[]) ?? []}
                    onChange={field.onChange}
                    addPlaceholder="Add an item…"
                  />
                )}
              />
            </Field>
            <Field
              label="Deliverables note"
              name={path("deliverablesNote")}
              hint="Optional — anything outside the chips"
            >
              <textarea
                className={textareaClass}
                {...register(path("deliverablesNote"))}
              />
            </Field>
          </div>

          {/* Spec notes — single optional textarea for TV size, LED pitch,
              print orientation, etc. */}
          <Field
            label="Spec notes"
            name={path("specNotes")}
            hint="Optional — TV size, LED pixel pitch, print orientation, etc."
          >
            <textarea
              className={textareaClass}
              {...register(path("specNotes"))}
            />
          </Field>

          {/* Per-activity data block */}
          <div className="space-y-4 border-t border-black/[0.06] pt-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
              Data captured at this activity
            </div>
            <Controller
              control={control}
              name={path("userDataCaptured")}
              render={({ field }) => (
                <ToggleRow
                  label="Is user data being captured?"
                  hint="Names, emails, opt-ins, anything we hand back"
                  value={Boolean(field.value)}
                  onChange={field.onChange}
                />
              )}
            />
            {safe.userDataCaptured && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Data fields captured"
                  required
                  name={path("dataFields")}
                  hint="e.g. Name, Email, Phone"
                >
                  <textarea
                    className={textareaClass}
                    {...register(path("dataFields"))}
                  />
                </Field>
                <Field
                  label="How shared back to client"
                  required
                  name={path("dataSharedBack")}
                  hint="e.g. CSV via email, API, dashboard"
                >
                  <input
                    className={inputClass}
                    {...register(path("dataSharedBack"))}
                  />
                </Field>
              </div>
            )}

            <Controller
              control={control}
              name={path("clientProvidesData")}
              render={({ field }) => (
                <ToggleRow
                  label="Is client providing pre-existing data?"
                  hint="Guest list, CRM dump, attendance roster"
                  value={Boolean(field.value)}
                  onChange={field.onChange}
                />
              )}
            />
            {safe.clientProvidesData && (
              <div className="space-y-3">
                <Field label="Format" required name={path("dataFormat")}>
                  <Controller
                    control={control}
                    name={path("dataFormat")}
                    render={({ field }) => (
                      <select
                        className={inputClass}
                        value={field.value as string}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      >
                        <option value="">Select…</option>
                        {DATA_FORMATS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </Field>
                <Field label="Notes" name={path("dataNotes")}>
                  <textarea
                    className={textareaClass}
                    {...register(path("dataNotes"))}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const JOURNEY_PLACEHOLDER = `Step 1: User scans QR at registration desk
Step 2: System creates a personalised badge
Step 3: Badge is printed and handed to user
Step 4: User enters venue`;

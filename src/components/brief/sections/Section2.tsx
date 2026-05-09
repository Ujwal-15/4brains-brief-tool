"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { INDOOR_OUTDOOR_OPTIONS } from "@/lib/briefSchema";
import { Field, inputClass, textareaClass } from "../Field";

// Date field with optional range. Defaults to a single date input;
// a small "+ Add end date" toggle expands it into a From/To pair so we
// don't force CS through a two-field UI for the common single-day case.
function DateField({
  label,
  required,
  fromName,
  toName,
  hint,
}: {
  label: string;
  required?: boolean;
  fromName: keyof BriefFormData;
  toName: keyof BriefFormData;
  hint?: string;
}) {
  const { register, setValue } = useFormContext<BriefFormData>();
  const toValue = useWatch({ name: toName }) as string | undefined;
  const [showRange, setShowRange] = useState<boolean>(Boolean(toValue));

  function expand() {
    setShowRange(true);
  }
  function collapse() {
    setValue(toName as never, "" as never, { shouldDirty: true });
    setShowRange(false);
  }

  return (
    <div data-field={fromName}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80">
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </span>
        {showRange ? (
          <button
            type="button"
            onClick={collapse}
            className="text-[11px] font-medium text-ink-soft/70 transition-colors hover:text-ink"
          >
            ← Single date
          </button>
        ) : (
          <button
            type="button"
            onClick={expand}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            + Add end date
          </button>
        )}
      </div>
      {showRange ? (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            aria-label={`${label} from`}
            className={inputClass}
            {...register(fromName)}
          />
          <input
            type="date"
            aria-label={`${label} to`}
            className={inputClass}
            {...register(toName)}
          />
        </div>
      ) : (
        <input
          type="date"
          aria-label={label}
          className={inputClass}
          {...register(fromName)}
        />
      )}
      {hint && (
        <p className="mt-1.5 text-[12px] text-ink-soft/70">{hint}</p>
      )}
    </div>
  );
}

export function Section2() {
  const { register, control } = useFormContext<BriefFormData>();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <DateField
        label="Event Date"
        required
        fromName="eventDateFrom"
        toName="eventDateTo"
        hint="Multi-day event? Click + Add end date."
      />

      <Field label="City / Cities" required name="cities">
        <input className={inputClass} {...register("cities")} />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Venue Name & Full Address" required name="venueAddress">
          <textarea className={textareaClass} {...register("venueAddress")} />
        </Field>
      </div>

      <Field label="Indoor / Outdoor / Both" required name="indoorOutdoor">
        <Controller
          control={control}
          name="indoorOutdoor"
          render={({ field }) => (
            <select className={inputClass} {...field}>
              <option value="">Select…</option>
              {INDOOR_OUTDOOR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        />
      </Field>

      <div className="hidden sm:block" />

      <DateField
        label="Setup Date"
        required
        fromName="setupDateFrom"
        toName="setupDateTo"
        hint="Spans multiple days? Click + Add end date."
      />

      <DateField
        label="Demo Date"
        fromName="demoDateFrom"
        toName="demoDateTo"
        hint="Optional — if there’s a demo for the client before the event."
      />
    </div>
  );
}

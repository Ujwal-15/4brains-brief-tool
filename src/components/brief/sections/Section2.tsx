"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { INDOOR_OUTDOOR_OPTIONS } from "@/lib/briefSchema";
import { Field, inputClass, textareaClass, Toggle } from "../Field";

export function Section2() {
  const { register, control } = useFormContext<BriefFormData>();
  const demoRequired = useWatch({ control, name: "demoRequired" });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Event Date(s)" required name="eventDates" hint="A date or range">
        <input className={inputClass} {...register("eventDates")} />
      </Field>
      <Field label="City / Cities" required name="cities">
        <input className={inputClass} {...register("cities")} />
      </Field>

      <Field label="Venue Name & Full Address" required name="venueAddress">
        <textarea className={textareaClass} {...register("venueAddress")} />
      </Field>

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

      <Field
        label="Event Start & End Time per slot"
        required
        name="eventTimes"
        hint="One slot per line — e.g. ‘Day 1: 10:00 – 18:00’"
      >
        <textarea className={textareaClass} {...register("eventTimes")} />
      </Field>

      <Field label="Setup Date & Time" required name="setupDateTime">
        <input
          type="datetime-local"
          className={inputClass}
          {...register("setupDateTime")}
        />
      </Field>
      <Field label="Setup Duration Available" required name="setupDuration">
        <input
          className={inputClass}
          placeholder="e.g. 6 hours"
          {...register("setupDuration")}
        />
      </Field>

      <Field label="Dismantle Date & Time" required name="dismantleDateTime">
        <input
          type="datetime-local"
          className={inputClass}
          {...register("dismantleDateTime")}
        />
      </Field>

      <div className="sm:col-span-2">
        <div className="mb-1 text-xs font-medium text-neutral-700">
          Demo Required
        </div>
        <Controller
          control={control}
          name="demoRequired"
          render={({ field }) => (
            <Toggle
              value={field.value}
              onChange={field.onChange}
              label={field.value ? "Yes" : "No"}
            />
          )}
        />
      </div>

      {demoRequired && (
        <Field label="Demo Date & Time" required name="demoDateTime">
          <input
            type="datetime-local"
            className={inputClass}
            {...register("demoDateTime")}
          />
        </Field>
      )}

      <div className="sm:col-span-2">
        <Field label="Venue Access Notes">
          <textarea
            className={textareaClass}
            {...register("venueAccessNotes")}
          />
        </Field>
      </div>
    </div>
  );
}

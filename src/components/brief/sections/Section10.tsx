"use client";

import { useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, inputClass } from "../Field";

export function Section10() {
  const { register } = useFormContext<BriefFormData>();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Field label="Demo Date" required name="timelineDemoDate">
        <input
          type="date"
          className={inputClass}
          {...register("timelineDemoDate")}
        />
      </Field>
      <Field label="Setup Date" required name="timelineSetupDate">
        <input
          type="date"
          className={inputClass}
          {...register("timelineSetupDate")}
        />
      </Field>
      <Field label="Final Deadline" required name="timelineFinalDeadline">
        <input
          type="date"
          className={inputClass}
          {...register("timelineFinalDeadline")}
        />
      </Field>
    </div>
  );
}

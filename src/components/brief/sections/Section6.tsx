"use client";

import { useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, textareaClass } from "../Field";

export function Section6() {
  const { register } = useFormContext<BriefFormData>();

  return (
    <Field
      label="Additional Notes"
      hint="Risks, VIPs, peak load, special handling, etc."
    >
      <textarea
        className={`${textareaClass} min-h-[140px]`}
        {...register("additionalNotes")}
      />
    </Field>
  );
}

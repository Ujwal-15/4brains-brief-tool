"use client";

import { useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, textareaClass } from "../Field";

export function Section9() {
  const { register } = useFormContext<BriefFormData>();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        label="What Client Will Provide"
        required
        name="clientWillProvide"
        hint="Written paragraph"
      >
        <textarea
          className={`${textareaClass} min-h-[140px]`}
          {...register("clientWillProvide")}
        />
      </Field>
      <Field
        label="What 4Brains Will Provide"
        required
        name="fourBrainsWillProvide"
        hint="Written paragraph"
      >
        <textarea
          className={`${textareaClass} min-h-[140px]`}
          {...register("fourBrainsWillProvide")}
        />
      </Field>
    </div>
  );
}

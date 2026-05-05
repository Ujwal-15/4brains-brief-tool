"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, inputClass, textareaClass } from "../Field";

export function Section5() {
  const { register, control } = useFormContext<BriefFormData>();

  return (
    <div className="space-y-4">
      <Field
        label="What does the client specifically want?"
        required
        name="clientWants"
      >
        <textarea className={textareaClass} {...register("clientWants")} />
      </Field>

      <Field
        label="Must-have features / non-negotiables"
        required
        name="mustHaves"
      >
        <textarea className={textareaClass} {...register("mustHaves")} />
      </Field>

      <Field label="Things client has explicitly said NO to">
        <textarea
          className={textareaClass}
          {...register("thingsClientSaidNo")}
        />
      </Field>

      <Field
        label="Reference links / videos / mood boards"
        hint="Paste links above. Optional file uploads below — file names saved to draft only."
      >
        <textarea
          className={`${inputClass} min-h-[60px]`}
          placeholder="https://..."
          {...register("referenceLinks")}
        />
        <Controller
          control={control}
          name="referenceMoodFiles"
          render={({ field }) => (
            <div className="mt-2">
              <input
                type="file"
                multiple
                onChange={(e) =>
                  field.onChange(
                    Array.from(e.target.files ?? []).map((f) => f.name),
                  )
                }
                className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-neutral-200"
              />
              {field.value.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  {field.value.map((n, i) => (
                    <li key={`${n}-${i}`}>• {n}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
      </Field>
    </div>
  );
}

"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, inputClass, textareaClass, Toggle } from "../Field";

export function Section6() {
  const { register, control } = useFormContext<BriefFormData>();
  const guidelinesShared = useWatch({ control, name: "brandGuidelinesShared" });
  const logosReceived = useWatch({ control, name: "logoFilesReceived" });
  const variations = useWatch({ control, name: "slotDayDesignVariations" });

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Brand Guidelines Shared <span className="text-red-500">*</span>
          </span>
          <Controller
            control={control}
            name="brandGuidelinesShared"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        {guidelinesShared ? (
          <Field
            label="Brand Guidelines File"
            required
            name="brandGuidelinesFile"
            hint="File upload coming later — file name saved to draft."
          >
            <Controller
              control={control}
              name="brandGuidelinesFile"
              render={({ field }) => (
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    field.onChange(f ? f.name : "");
                  }}
                  className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-neutral-200"
                />
              )}
            />
            {/* Show selected name */}
            <Controller
              control={control}
              name="brandGuidelinesFile"
              render={({ field }) =>
                field.value ? (
                  <p className="mt-1 text-xs text-neutral-600">
                    Selected: {field.value}
                  </p>
                ) : (
                  <></>
                )
              }
            />
          </Field>
        ) : (
          <Field
            label="Flag for follow-up"
            required
            name="brandGuidelinesFollowUp"
            hint="Note what needs to be requested from the client."
          >
            <textarea
              className={textareaClass}
              {...register("brandGuidelinesFollowUp")}
            />
          </Field>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Logo Files Received <span className="text-red-500">*</span>
          </span>
          <Controller
            control={control}
            name="logoFilesReceived"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        {logosReceived && (
          <Field
            label="Logo Files"
            required
            name="logoFiles"
            hint="File upload coming later — file names saved to draft."
          >
            <Controller
              control={control}
              name="logoFiles"
              render={({ field }) => (
                <>
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
                </>
              )}
            />
          </Field>
        )}
      </div>

      <Field label="Brand Colors / Fonts">
        <input
          className={inputClass}
          placeholder="e.g. #D4811C, Inter / Roboto"
          {...register("brandColorsFonts")}
        />
      </Field>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Slot/Day-wise Design Variations
          </span>
          <Controller
            control={control}
            name="slotDayDesignVariations"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        {variations && (
          <Field
            label="Describe the variations"
            required
            name="slotDayDesignVariationsNotes"
          >
            <textarea
              className={textareaClass}
              {...register("slotDayDesignVariationsNotes")}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

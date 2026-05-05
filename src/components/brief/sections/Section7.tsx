"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { DATA_FORMATS } from "@/lib/briefSchema";
import { Field, inputClass, textareaClass, Toggle } from "../Field";

export function Section7() {
  const { register, control } = useFormContext<BriefFormData>();
  const captured = useWatch({ control, name: "userDataCaptured" });
  const provided = useWatch({ control, name: "clientProvidesData" });

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Is User Data Being Captured? <span className="text-red-500">*</span>
          </span>
          <Controller
            control={control}
            name="userDataCaptured"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        {captured && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Data fields captured"
              required
              name="dataFields"
              hint="e.g. Name, Email, Phone"
            >
              <textarea
                className={textareaClass}
                {...register("dataFields")}
              />
            </Field>
            <Field
              label="How shared back to client"
              required
              name="dataSharedBack"
              hint="e.g. CSV via email, API, dashboard"
            >
              <input
                className={inputClass}
                {...register("dataSharedBack")}
              />
            </Field>
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Is Client Providing Pre-existing Data?{" "}
            <span className="text-red-500">*</span>
          </span>
          <Controller
            control={control}
            name="clientProvidesData"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        {provided && (
          <div className="mt-3 space-y-4">
            <Field label="Format" required name="dataFormat">
              <Controller
                control={control}
                name="dataFormat"
                render={({ field }) => (
                  <select className={inputClass} {...field}>
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

            <Field
              label="Sample file"
              hint="File upload coming later — file name saved to draft."
            >
              <Controller
                control={control}
                name="dataSampleFile"
                render={({ field }) => (
                  <>
                    <input
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        field.onChange(f ? f.name : "");
                      }}
                      className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-neutral-200"
                    />
                    {field.value && (
                      <p className="mt-1 text-xs text-neutral-600">
                        Selected: {field.value}
                      </p>
                    )}
                  </>
                )}
              />
            </Field>

            <Field label="Notes">
              <textarea
                className={textareaClass}
                {...register("dataNotes")}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

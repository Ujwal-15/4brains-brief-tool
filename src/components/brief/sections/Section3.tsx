"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData, Category } from "@/lib/briefSchema";
import {
  ACTIVITIES_BY_CATEGORY,
  CATEGORIES,
  COMMUNICATION_FLOWS,
  ORIENTATIONS,
  OUTPUT_DEVICES,
  OUTPUT_FORMATS,
  PRINT_SIZES,
  TV_SIZES,
} from "@/lib/briefSchema";
import { ChipGroup, Field, inputClass, textareaClass, Toggle } from "../Field";

const STEP_HEADING =
  "mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500";

export function Section3() {
  const { register, control, setValue } = useFormContext<BriefFormData>();
  const category = useWatch({ control, name: "category" }) as Category | "";
  const outputDevices = useWatch({ control, name: "outputDevices" });
  const printRequired = useWatch({ control, name: "printRequired" });

  const activityList =
    category && category in ACTIVITIES_BY_CATEGORY
      ? ACTIVITIES_BY_CATEGORY[category as Category]
      : [];

  const isCustomCategory = category === "New / Custom Activity";

  return (
    <div className="space-y-6">
      {/* Step 1: Category */}
      <Field
        label="Step 1 — Category"
        required
        name="category"
        headingClassName={STEP_HEADING}
      >
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <ChipGroup
              options={CATEGORIES}
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
                setValue("activityType", "");
                setValue("activityCustomName", "");
              }}
            />
          )}
        />
      </Field>

      {/* Step 2: Activity */}
      {category && (
        <>
          {isCustomCategory ? (
            <Field
              label="Step 2 — Custom Activity Name"
              required
              name="activityCustomName"
              headingClassName={STEP_HEADING}
            >
              <input
                className={inputClass}
                placeholder="Describe the new activity"
                {...register("activityCustomName")}
              />
            </Field>
          ) : (
            <Field
              label="Step 2 — Activity"
              required
              name="activityType"
              headingClassName={STEP_HEADING}
            >
              <Controller
                control={control}
                name="activityType"
                render={({ field }) => (
                  <ChipGroup
                    options={activityList}
                    value={field.value}
                    onChange={(v) =>
                      field.onChange(typeof v === "string" ? v : "")
                    }
                  />
                )}
              />
            </Field>
          )}
        </>
      )}

      {/* Activity details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Activity Name" required name="activityName">
          <input className={inputClass} {...register("activityName")} />
        </Field>
        <Field
          label="Number of Activities / Installations"
          required
          name="activityCount"
        >
          <input
            type="number"
            min={1}
            className={inputClass}
            {...register("activityCount")}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Activity Description"
            required
            name="activityDescription"
            hint="2–4 lines"
          >
            <textarea
              className={textareaClass}
              {...register("activityDescription")}
            />
          </Field>
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-5 rounded border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Activity Specifications
        </div>

        <Field
          label="Output / Display Device"
          required
          name="outputDevices"
        >
          <Controller
            control={control}
            name="outputDevices"
            render={({ field }) => (
              <ChipGroup
                multi
                options={OUTPUT_DEVICES}
                value={field.value}
                onChange={(v) => field.onChange(Array.isArray(v) ? v : [])}
              />
            )}
          />
        </Field>

        {outputDevices?.includes("TV Screen") && (
          <Field label="TV Size" required name="tvSize">
            <Controller
              control={control}
              name="tvSize"
              render={({ field }) => (
                <select className={inputClass} {...field}>
                  <option value="">Select size…</option>
                  {TV_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            />
          </Field>
        )}

        {outputDevices?.includes("LED Screen") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="LED Pixel Pitch" required name="ledPixelPitch">
              <input
                className={inputClass}
                placeholder="e.g. P3.91"
                {...register("ledPixelPitch")}
              />
            </Field>
            <Field label="LED Dimensions" required name="ledDimensions">
              <input
                className={inputClass}
                placeholder="e.g. 4m x 3m"
                {...register("ledDimensions")}
              />
            </Field>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">
              Print Required <span className="text-red-500">*</span>
            </span>
            <Controller
              control={control}
              name="printRequired"
              render={({ field }) => (
                <Toggle
                  value={field.value}
                  onChange={field.onChange}
                  label={field.value ? "Yes" : "No"}
                />
              )}
            />
          </div>

          {printRequired && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Print Size" required name="printSize">
                  <Controller
                    control={control}
                    name="printSize"
                    render={({ field }) => (
                      <ChipGroup
                        options={PRINT_SIZES}
                        value={field.value}
                        onChange={(v) =>
                          field.onChange(typeof v === "string" ? v : "")
                        }
                      />
                    )}
                  />
                </Field>
              </div>

              <Field label="Total Prints" required name="printTotal">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  {...register("printTotal")}
                />
              </Field>

              <Field label="Orientation" required name="printOrientation">
                <Controller
                  control={control}
                  name="printOrientation"
                  render={({ field }) => (
                    <select className={inputClass} {...field}>
                      <option value="">Select…</option>
                      {ORIENTATIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </Field>

              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-xs font-medium text-neutral-700">
                  Pre-printed templates from client
                </span>
                <Controller
                  control={control}
                  name="printPreTemplates"
                  render={({ field }) => (
                    <Toggle
                      value={field.value}
                      onChange={field.onChange}
                      label={field.value ? "Yes" : "No"}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>

        <Field label="Output Format" required name="outputFormats">
          <Controller
            control={control}
            name="outputFormats"
            render={({ field }) => (
              <ChipGroup
                multi
                options={OUTPUT_FORMATS}
                value={field.value}
                onChange={(v) => field.onChange(Array.isArray(v) ? v : [])}
              />
            )}
          />
        </Field>

        {category === "Registration" && (
          <Field
            label="Communication / Invite Flow"
            required
            name="communicationFlows"
          >
            <Controller
              control={control}
              name="communicationFlows"
              render={({ field }) => (
                <ChipGroup
                  multi
                  options={COMMUNICATION_FLOWS}
                  value={field.value}
                  onChange={(v) =>
                    field.onChange(Array.isArray(v) ? v : [])
                  }
                />
              )}
            />
          </Field>
        )}
      </div>

      {/* Reference attachments — stub */}
      <Field
        label="Reference Attachments"
        hint="File upload coming in a later step — file names are saved to draft for now."
      >
        <Controller
          control={control}
          name="referenceAttachments"
          render={({ field }) => (
            <>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  field.onChange(files.map((f) => f.name));
                }}
                className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-neutral-200"
              />
              {field.value && field.value.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  {field.value.map((name, i) => (
                    <li key={`${name}-${i}`}>• {name}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        />
      </Field>
    </div>
  );
}

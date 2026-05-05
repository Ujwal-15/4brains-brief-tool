"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, inputClass, textareaClass, Toggle } from "../Field";

export function Section8() {
  const { register, control } = useFormContext<BriefFormData>();
  const fab = useWatch({ control, name: "fabricationRequired" });
  const internetByClient = useWatch({ control, name: "internetByClient" });

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Fabrication Required <span className="text-red-500">*</span>
          </span>
          <Controller
            control={control}
            name="fabricationRequired"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        {fab && (
          <div className="mt-3 space-y-4">
            <Field
              label="Fabrication details"
              required
              name="fabricationNotes"
              hint="Size, material, props, vendor, references"
            >
              <textarea
                className={textareaClass}
                {...register("fabricationNotes")}
              />
            </Field>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700">
                Line Diagram Required
              </span>
              <Controller
                control={control}
                name="lineDiagramRequired"
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

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-700">
            Internet Provided by Client{" "}
            <span className="text-red-500">*</span>
          </span>
          <Controller
            control={control}
            name="internetByClient"
            render={({ field }) => (
              <Toggle
                value={field.value}
                onChange={field.onChange}
                label={field.value ? "Yes" : "No"}
              />
            )}
          />
        </div>
        <div className="mt-3">
          {internetByClient ? (
            <Field
              label="Speed & type"
              required
              name="internetClientDetails"
              hint="e.g. 100 Mbps fiber, dedicated SSID"
            >
              <input
                className={inputClass}
                {...register("internetClientDetails")}
              />
            </Field>
          ) : (
            <Field
              label="4Brains arrangement"
              required
              name="internetFourBrainsArrangement"
              hint="Dongle / hotspot / leased line, etc."
            >
              <input
                className={inputClass}
                {...register("internetFourBrainsArrangement")}
              />
            </Field>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, ToggleRow, inputClass, textareaClass } from "../Field";

export function Section4() {
  const { register, control } = useFormContext<BriefFormData>();
  const clientProvidesDesign = useWatch({
    control,
    name: "clientProvidesDesign",
  });
  const sharedYet = useWatch({ control, name: "brandGuidelinesSharedYet" });
  const variations = useWatch({ control, name: "slotDayDesignVariations" });

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
          Who provides design + brand guidelines?
        </div>
        <Controller
          control={control}
          name="clientProvidesDesign"
          render={({ field }) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-card p-3.5 text-[13px] transition-all ${
                  field.value === true
                    ? "bg-white shadow-soft ring-1 ring-primary/20"
                    : "bg-surface-alt/70 shadow-hairline hover:bg-surface-alt"
                }`}
              >
                <input
                  type="radio"
                  className="h-4 w-4 accent-primary"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                />
                <span className="text-ink">
                  Client provides design / brand guidelines
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-card p-3.5 text-[13px] transition-all ${
                  field.value === false
                    ? "bg-white shadow-soft ring-1 ring-primary/20"
                    : "bg-surface-alt/70 shadow-hairline hover:bg-surface-alt"
                }`}
              >
                <input
                  type="radio"
                  className="h-4 w-4 accent-primary"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                />
                <span className="text-ink">
                  4Brains uses our own internal style
                </span>
              </label>
            </div>
          )}
        />
      </div>

      {clientProvidesDesign && (
        <div className="space-y-3 rounded-card bg-surface-alt/70 p-5 shadow-hairline">
          <Controller
            control={control}
            name="brandGuidelinesSharedYet"
            render={({ field }) => (
              <ToggleRow
                label="Has the client shared the brand guidelines yet?"
                hint="If not, we'll flag it for follow-up"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {!sharedYet && (
            <Field
              label="Flag for follow-up"
              required
              name="brandGuidelinesFollowUp"
              hint="Note what needs to be requested from the client"
            >
              <textarea
                className={textareaClass}
                {...register("brandGuidelinesFollowUp")}
              />
            </Field>
          )}
        </div>
      )}

      <div className="rounded-card bg-surface-alt/70 p-5 shadow-hairline">
        <Controller
          control={control}
          name="logoFilesReceived"
          render={({ field }) => (
            <ToggleRow
              label="Logo files received from client"
              hint="High-res, vector preferred"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <Field label="Brand Colors / Fonts">
        <input
          className={inputClass}
          placeholder="e.g. #006FBA, Inter / Roboto"
          {...register("brandColorsFonts")}
        />
      </Field>

      <div className="space-y-3 rounded-card bg-surface-alt/70 p-5 shadow-hairline">
        <Controller
          control={control}
          name="slotDayDesignVariations"
          render={({ field }) => (
            <ToggleRow
              label="Slot / Day-wise design variations"
              hint="Different visuals across event days or time slots"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
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

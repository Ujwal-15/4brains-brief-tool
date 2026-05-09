"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import {
  Field,
  ToggleRow,
  inputClass,
  textareaClass,
} from "../Field";

export function Section5() {
  const { register, control } = useFormContext<BriefFormData>();
  const fabClient = useWatch({ control, name: "fabricationByClient" });
  const fab4B = useWatch({ control, name: "fabricationByFourBrains" });
  const oneLine = useWatch({ control, name: "oneLineDiagramRequired" });
  const internetByClient = useWatch({ control, name: "internetByClient" });

  return (
    <div className="space-y-6">
      {/* Fabrication — split into Client / 4Brains */}
      <div className="space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
          Fabrication
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Client side */}
          <div className="space-y-3 rounded-card bg-surface-alt/70 p-5 shadow-hairline">
            <Controller
              control={control}
              name="fabricationByClient"
              render={({ field }) => (
                <ToggleRow
                  label="From client"
                  hint="What the client is bringing or building"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {fabClient && (
              <Field
                label="What client is providing"
                name="fabricationClientNotes"
                hint="e.g. backdrop frame, branded counter, signage they're shipping"
              >
                <textarea
                  className={textareaClass}
                  {...register("fabricationClientNotes")}
                />
              </Field>
            )}
          </div>

          {/* 4Brains side */}
          <div className="space-y-3 rounded-card bg-surface-alt/70 p-5 shadow-hairline">
            <Controller
              control={control}
              name="fabricationByFourBrains"
              render={({ field }) => (
                <ToggleRow
                  label="From 4Brains"
                  hint="What our team is fabricating in-house"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {fab4B && (
              <Field
                label="What 4Brains will fabricate"
                required
                name="fabricationFourBrainsNotes"
                hint="Size, material, vendor, references — anything we're building"
              >
                <textarea
                  className={textareaClass}
                  {...register("fabricationFourBrainsNotes")}
                />
              </Field>
            )}
          </div>
        </div>
      </div>

      {/* One-line diagram */}
      <div className="space-y-3 rounded-card bg-surface-alt/70 p-5 shadow-hairline">
        <Controller
          control={control}
          name="oneLineDiagramRequired"
          render={({ field }) => (
            <ToggleRow
              label="One-line diagram (1LD) required?"
              hint="Schematic for power / signal flow / AV layout"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {oneLine && (
          <Field
            label="1LD notes"
            name="oneLineDiagramNotes"
            hint="Who owns it, when it's due, links to references"
          >
            <textarea
              className={textareaClass}
              {...register("oneLineDiagramNotes")}
            />
          </Field>
        )}
      </div>

      {/* Internet */}
      <div className="space-y-3 rounded-card bg-surface-alt/70 p-5 shadow-hairline">
        <Controller
          control={control}
          name="internetByClient"
          render={({ field }) => (
            <ToggleRow
              label="Internet provided by client"
              hint="Toggle on if the venue / client supplies the connection"
              required
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
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
  );
}

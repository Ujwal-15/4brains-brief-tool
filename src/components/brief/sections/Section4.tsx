"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import type { BriefFormData } from "@/lib/briefSchema";
import { parseJourneySteps, stepsToMermaid } from "@/lib/briefSchema";
import { Field, textareaClass } from "../Field";
import { MermaidPreview } from "../MermaidPreview";

const PLACEHOLDER = `Step 1: User scans QR at registration desk
Step 2: System creates a personalised badge
Step 3: Badge is printed and handed to user
Step 4: User enters venue`;

export function Section4() {
  const { register, control } = useFormContext<BriefFormData>();
  const journey = useWatch({ control, name: "userJourney" });

  // Debounce mermaid source so we don't re-render on every keystroke.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(stepsToMermaid(parseJourneySteps(journey || "")));
    }, 300);
    return () => clearTimeout(t);
  }, [journey]);

  return (
    <div className="space-y-5">
      <Field
        label="User Journey"
        required
        name="userJourney"
        hint="One step per line. ‘Step 1:’, ‘1.’, or ‘-’ prefixes all work."
      >
        <textarea
          className={`${textareaClass} min-h-[140px] font-mono`}
          placeholder={PLACEHOLDER}
          {...register("userJourney")}
        />
      </Field>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Flowchart preview
        </div>
        <MermaidPreview source={debounced} />
      </div>

      <Field
        label="Custom Flowchart Override"
        hint="Optional. File upload coming in a later step — file name is saved to draft for now."
      >
        <Controller
          control={control}
          name="customFlowchart"
          render={({ field }) => (
            <>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  field.onChange(f ? f.name : "");
                }}
                className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-neutral-200"
              />
              {field.value && (
                <p className="mt-2 text-xs text-neutral-600">
                  Selected: {field.value}
                </p>
              )}
            </>
          )}
        />
      </Field>
    </div>
  );
}

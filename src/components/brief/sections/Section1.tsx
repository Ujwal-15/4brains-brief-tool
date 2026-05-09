"use client";

import { useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { Field, inputClass } from "../Field";

export function Section1() {
  const { register } = useFormContext<BriefFormData>();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Client / Brand Name" required name="clientName">
        <input className={inputClass} {...register("clientName")} />
      </Field>
      <Field label="Project / Event Name" required name="projectName">
        <input className={inputClass} {...register("projectName")} />
      </Field>

      <div className="sm:col-span-2">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Client point of contact
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="POC Name" required name="pocName">
            <input className={inputClass} {...register("pocName")} />
          </Field>
          <Field label="POC Phone" required name="pocPhone">
            <input
              type="tel"
              className={inputClass}
              {...register("pocPhone")}
            />
          </Field>
        </div>
      </div>

      <Field label="CS/BD Owner from 4Brains" required name="csbdOwner">
        <input className={inputClass} {...register("csbdOwner")} />
      </Field>

      <Field label="PM Assigned" required name="pmName">
        <input
          className={inputClass}
          placeholder="Type the PM's name"
          {...register("pmName")}
        />
      </Field>

      <Field label="Brief Received On" required name="briefReceivedOn">
        <input
          type="date"
          className={inputClass}
          {...register("briefReceivedOn")}
        />
      </Field>
    </div>
  );
}

"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { RECEIVED_VIA_OPTIONS } from "@/lib/briefSchema";
import { Field, inputClass } from "../Field";

type PMOption = { id: string; name: string; email: string };

export function Section1({ pmOptions }: { pmOptions: PMOption[] }) {
  const { register, control } = useFormContext<BriefFormData>();

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
          <Field label="POC Designation" required name="pocDesignation">
            <input className={inputClass} {...register("pocDesignation")} />
          </Field>
          <Field label="POC Phone" required name="pocPhone">
            <input
              type="tel"
              className={inputClass}
              {...register("pocPhone")}
            />
          </Field>
          <Field label="POC Email" required name="pocEmail">
            <input
              type="email"
              className={inputClass}
              {...register("pocEmail")}
            />
          </Field>
        </div>
      </div>

      <Field label="CS/BD Owner from 4Brains" required name="csbdOwner">
        <input className={inputClass} {...register("csbdOwner")} />
      </Field>

      <Field label="PM Assigned" required name="pmId">
        <Controller
          control={control}
          name="pmId"
          render={({ field }) => (
            <select className={inputClass} {...field}>
              <option value="">Select PM…</option>
              {pmOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
        />
      </Field>

      <Field label="Brief Received On" required name="briefReceivedOn">
        <input
          type="date"
          className={inputClass}
          {...register("briefReceivedOn")}
        />
      </Field>

      <Field label="Brief Received Via">
        <Controller
          control={control}
          name="briefReceivedVia"
          render={({ field }) => (
            <select className={inputClass} {...field}>
              <option value="">—</option>
              {RECEIVED_VIA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        />
      </Field>
    </div>
  );
}

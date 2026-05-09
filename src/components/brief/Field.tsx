"use client";

import type { ReactNode } from "react";
import { useFormContext, type FieldErrors } from "react-hook-form";

export const inputClass =
  "w-full rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-[13.5px] text-ink outline-none transition-shadow placeholder:text-ink-soft/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:bg-black/[0.03] disabled:text-ink-soft";

export const textareaClass = `${inputClass} min-h-[88px] leading-relaxed`;

function lookupError(errors: FieldErrors, name?: string): string | undefined {
  if (!name) return undefined;
  const e = (errors as Record<string, { message?: unknown } | undefined>)[name];
  const msg = e?.message;
  return typeof msg === "string" ? msg : undefined;
}

export function Field({
  label,
  required,
  hint,
  name,
  headingClassName,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  name?: string;
  headingClassName?: string;
  children: ReactNode;
}) {
  const ctx = useFormContext();
  const error = lookupError(ctx?.formState?.errors ?? {}, name);

  return (
    <div data-field={name}>
      <div
        className={
          headingClassName ??
          "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80"
        }
      >
        {label}
        {required && (
          <span className="ml-1 text-primary" aria-label="required">
            *
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-soft/80">{hint}</p>
      )}
    </div>
  );
}

export function ChipGroup({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: readonly string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
}) {
  const isSelected = (opt: string) =>
    multi ? (value as string[]).includes(opt) : value === opt;

  const toggle = (opt: string) => {
    if (multi) {
      const current = value as string[];
      onChange(
        current.includes(opt)
          ? current.filter((v) => v !== opt)
          : [...current, opt],
      );
    } else {
      onChange(opt);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = isSelected(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              selected
                ? "bg-ink text-white shadow-soft"
                : "bg-white text-ink-soft shadow-hairline hover:text-ink"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// A toggle row that pairs a label (+ optional hint) on the left with a
// switch on the right. Replaces the bare `flex items-center justify-between
// + Toggle` pattern that left dead air between label and toggle on wide
// cards. The label-stack + tight toggle group reads as an intentional
// settings row instead.
export function ToggleRow({
  label,
  hint,
  required,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium leading-tight text-ink">
          {label}
          {required && (
            <span className="ml-1 text-primary" aria-label="required">
              *
            </span>
          )}
        </div>
        {hint && (
          <div className="mt-0.5 text-[11.5px] leading-snug text-ink-soft">
            {hint}
          </div>
        )}
      </div>
      <div className="shrink-0">
        <Toggle
          value={value}
          onChange={onChange}
          label={value ? "Yes" : "No"}
        />
      </div>
    </div>
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-[22px] w-10 items-center rounded-full transition-colors ${
          value ? "bg-primary" : "bg-black/15"
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-soft transition-transform ${
            value ? "translate-x-[20px]" : "translate-x-0.5"
          }`}
        />
      </button>
      {label && <span className="text-[12px] text-ink-soft">{label}</span>}
    </div>
  );
}

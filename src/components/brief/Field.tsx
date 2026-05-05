"use client";

import type { ReactNode } from "react";
import { useFormContext, type FieldErrors } from "react-hook-form";

export const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-neutral-50 disabled:text-neutral-500";

export const textareaClass = `${inputClass} min-h-[80px]`;

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
          headingClassName ?? "mb-1 text-xs font-medium text-neutral-700"
        }
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </div>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>
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
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              selected
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {opt}
          </button>
        );
      })}
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
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? "bg-accent" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      {label && <span className="text-xs text-neutral-700">{label}</span>}
    </div>
  );
}

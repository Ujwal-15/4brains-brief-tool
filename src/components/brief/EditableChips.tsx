"use client";

import { useState } from "react";

// Editable chip group used for deliverables and other "list of strings" fields.
//
// Two flavors:
//   - Open list (no `options`): CS sees the current value as removable chips
//     plus an "Add an item" input. Free text. Used for deliverables.
//   - Fixed options list (`options` provided): each option is a toggleable
//     chip; CS picks/unpicks. Used for communication-flow style fields.

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  options?: readonly string[];
  addPlaceholder?: string;
};

export function EditableChips({
  value,
  onChange,
  options,
  addPlaceholder = "Add…",
}: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  function toggle(item: string) {
    if (value.includes(item)) remove(item);
    else onChange([...value, item]);
  }

  // Fixed-options mode (multi-select chips).
  if (options) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt);
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

  // Open-list mode — current value as removable chips + add input.
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-support/10 px-3 py-1 text-[12px] font-medium text-support shadow-hairline"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Remove ${item}`}
                className="opacity-60 transition-opacity hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={addPlaceholder}
          className="flex-1 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2 text-[13px] text-ink outline-none transition-shadow placeholder:text-ink-soft/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="rounded-full bg-ink px-3.5 py-2 text-[12px] font-medium text-white shadow-soft transition-all hover:-translate-y-px hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}

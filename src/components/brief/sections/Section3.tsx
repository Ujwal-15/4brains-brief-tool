"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import { EMPTY_ACTIVITY } from "@/lib/briefSchema";
import { Activity } from "../Activity";

type Props = {
  // Controlled open-state, lifted to BriefForm so validation can open the
  // right card when scrolling to a missing field inside an activity.
  openMap: Record<number, boolean>;
  setOpenMap: (next: Record<number, boolean>) => void;
};

export function Section3({ openMap, setOpenMap }: Props) {
  const { control } = useFormContext<BriefFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "activities",
  });

  function toggle(i: number) {
    setOpenMap({ ...openMap, [i]: !openMap[i] });
  }

  function handleAdd() {
    append({ ...EMPTY_ACTIVITY });
    // Open the newly appended card; collapse the rest.
    setOpenMap({ [fields.length]: true });
  }

  function handleRemove(i: number) {
    remove(i);
    const next: Record<number, boolean> = {};
    Object.keys(openMap).forEach((k) => {
      const n = Number(k);
      if (n < i) next[n] = openMap[n];
      else if (n > i) next[n - 1] = openMap[n];
    });
    setOpenMap(next);
  }

  return (
    <div className="space-y-4">
      {fields.map((field, i) => (
        <Activity
          key={field.id}
          index={i}
          open={!!openMap[i]}
          onToggle={() => toggle(i)}
          onRemove={fields.length > 1 ? () => handleRemove(i) : undefined}
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="group flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-ink-soft/20 bg-surface-alt/50 px-4 py-4 text-[13px] text-ink-soft transition-colors hover:border-primary/40 hover:bg-surface-alt hover:text-primary"
      >
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-xs leading-none shadow-hairline transition-transform group-hover:rotate-90"
        >
          +
        </span>
        <span>Add another activity</span>
      </button>
    </div>
  );
}

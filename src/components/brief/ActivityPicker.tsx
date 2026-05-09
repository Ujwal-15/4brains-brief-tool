"use client";

// Catalog-driven activity picker. Native <select> + <optgroup> grouped by
// category, plus a Custom option at the bottom. Picking a product auto-
// populates the activity's deliverables (4Brains + Client) from the catalog.

import { Controller, useFormContext } from "react-hook-form";
import type { BriefFormData } from "@/lib/briefSchema";
import {
  CATALOG_CATEGORIES,
  CUSTOM_PRODUCT_ID,
  PRODUCT_CATALOG,
  findProduct,
} from "@/lib/catalog";
import { Field, inputClass } from "./Field";

type Props = { index: number };

export function ActivityPicker({ index }: Props) {
  const { register, control, setValue, getValues } =
    useFormContext<BriefFormData>();

  const productPath = `activities.${index}.productId` as const;
  const customNamePath =
    `activities.${index}.customProductName` as const;
  const fourBrainsPath =
    `activities.${index}.fourBrainsDeliverables` as const;
  const clientPath = `activities.${index}.clientDeliverables` as const;

  function applyCatalogDefaults(productId: string) {
    if (!productId) return;
    if (productId === CUSTOM_PRODUCT_ID) {
      // Custom — leave deliverables alone (CS will fill them).
      return;
    }
    const product = findProduct(productId);
    if (!product) return;

    // Only overwrite deliverables if they're currently empty — don't clobber
    // edits CS may have made on a previously-picked product.
    const current4B = getValues(fourBrainsPath);
    const currentClient = getValues(clientPath);
    if (!current4B || current4B.length === 0) {
      setValue(fourBrainsPath, [...product.fourBrainsDeliverables]);
    }
    if (!currentClient || currentClient.length === 0) {
      setValue(clientPath, [...product.clientDeliverables]);
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Activity" required name={productPath}>
        <Controller
          control={control}
          name={productPath}
          render={({ field }) => (
            <select
              className={inputClass}
              value={field.value as string}
              onChange={(e) => {
                field.onChange(e);
                applyCatalogDefaults(e.target.value);
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            >
              <option value="">Pick an activity…</option>
              {CATALOG_CATEGORIES.map((cat) => {
                const items = PRODUCT_CATALOG.filter(
                  (p) => p.category === cat,
                );
                if (items.length === 0) return null;
                return (
                  <optgroup key={cat} label={cat}>
                    {items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
              <option value={CUSTOM_PRODUCT_ID}>Custom activity…</option>
            </select>
          )}
        />
      </Field>

      <Controller
        control={control}
        name={productPath}
        render={({ field }) =>
          field.value === CUSTOM_PRODUCT_ID ? (
            <Field
              label="Custom activity name"
              required
              name={customNamePath}
            >
              <input
                className={inputClass}
                placeholder="Describe the custom activity"
                {...register(customNamePath)}
              />
            </Field>
          ) : (
            <></>
          )
        }
      />
    </div>
  );
}

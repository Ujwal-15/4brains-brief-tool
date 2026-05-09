"""
One-shot script that reads the Master Deliverables.xlsx and emits a clean
TypeScript catalog at src/lib/catalog.ts. Run manually whenever the master
sheet changes:

    python3 scripts/build-catalog.py /path/to/Master\\ Deliverables.xlsx
"""

import json
import re
import sys
from pathlib import Path

import openpyxl

# Category normalization — collapse Excel's casing inconsistencies.
CATEGORY_NORMALIZE = {
    "INTERACTIVE & INFORMATION": "Interactive & Information",
    "Interactive": "Interactive & Information",  # merge the lone "Interactive" rows
    "AI ACTIVATIONS": "AI Activations",
    "Installation": "Installation",
    "Photobooth": "Photobooth",
    "Gamification": "Gamification",
    "Registration": "Registration",
    "App Development": "App Development",
}


def clean_deliverables(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = re.split(r"\s*/\s*", str(raw))
    items: list[str] = []
    for p in parts:
        p = p.strip()
        # strip leading dashes / bullets
        p = re.sub(r"^[\-\*•]+\s*", "", p)
        p = p.strip()
        if not p:
            continue
        # collapse double spaces
        p = re.sub(r"\s+", " ", p)
        items.append(p)
    # dedupe while preserving order
    seen = set()
    out = []
    for i in items:
        key = i.lower()
        if key not in seen:
            seen.add(key)
            out.append(i)
    return out


def slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def main(xlsx_path: str) -> None:
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb["Master Data"]

    products: list[dict] = []
    seen_names = set()

    for row in ws.iter_rows(min_row=2, values_only=True):
        category_raw, name_raw, four_brains_raw, client_raw, *_ = row
        if not category_raw or not name_raw:
            continue
        name = str(name_raw).strip()
        if not name or name in seen_names:
            continue
        seen_names.add(name)

        category_raw_str = str(category_raw).strip()
        category = CATEGORY_NORMALIZE.get(
            category_raw_str,
            CATEGORY_NORMALIZE.get(category_raw_str.upper(), category_raw_str),
        )

        products.append(
            {
                "id": slugify(name),
                "name": name,
                "category": category,
                "fourBrainsDeliverables": clean_deliverables(four_brains_raw),
                "clientDeliverables": clean_deliverables(client_raw),
            }
        )

    # Stable ordering: by category, then name.
    cat_order = [
        "Registration",
        "Interactive & Information",
        "AI Activations",
        "Gamification",
        "Photobooth",
        "Installation",
        "App Development",
    ]
    products.sort(
        key=lambda p: (
            cat_order.index(p["category"]) if p["category"] in cat_order else 999,
            p["name"].lower(),
        )
    )

    # Distinct categories actually present.
    categories = []
    for p in products:
        if p["category"] not in categories:
            categories.append(p["category"])

    # Emit TypeScript.
    out_lines = [
        "// Auto-generated from Master Deliverables.xlsx via scripts/build-catalog.py.",
        "// DO NOT EDIT BY HAND — re-run the script to refresh.",
        "",
        "export type CatalogProduct = {",
        "  id: string;",
        "  name: string;",
        "  category: string;",
        "  fourBrainsDeliverables: readonly string[];",
        "  clientDeliverables: readonly string[];",
        "};",
        "",
        f"export const CATALOG_CATEGORIES = {json.dumps(categories, indent=2)} as const;",
        "",
        "export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];",
        "",
        "export const PRODUCT_CATALOG: readonly CatalogProduct[] = [",
    ]
    for p in products:
        out_lines.append("  {")
        out_lines.append(f"    id: {json.dumps(p['id'])},")
        out_lines.append(f"    name: {json.dumps(p['name'])},")
        out_lines.append(f"    category: {json.dumps(p['category'])},")
        out_lines.append(
            f"    fourBrainsDeliverables: {json.dumps(p['fourBrainsDeliverables'])},"
        )
        out_lines.append(
            f"    clientDeliverables: {json.dumps(p['clientDeliverables'])},"
        )
        out_lines.append("  },")
    out_lines += [
        "] as const;",
        "",
        "// Sentinel for a custom (off-catalog) activity inside an Activity card.",
        'export const CUSTOM_PRODUCT_ID = "__custom__";',
        "",
        "export function findProduct(id: string): CatalogProduct | undefined {",
        "  return PRODUCT_CATALOG.find((p) => p.id === id);",
        "}",
        "",
        "// Group products by category, preserving CATALOG_CATEGORIES order.",
        "export function productsByCategory(): Record<string, CatalogProduct[]> {",
        "  const out: Record<string, CatalogProduct[]> = {};",
        "  for (const cat of CATALOG_CATEGORIES) out[cat] = [];",
        "  for (const p of PRODUCT_CATALOG) {",
        "    if (!out[p.category]) out[p.category] = [];",
        "    out[p.category].push(p);",
        "  }",
        "  return out;",
        "}",
        "",
    ]

    out_path = Path(__file__).resolve().parent.parent / "src" / "lib" / "catalog.ts"
    out_path.write_text("\n".join(out_lines))
    print(f"Wrote {len(products)} products across {len(categories)} categories")
    print(f"  → {out_path}")
    print()
    print("Categories:")
    for cat in categories:
        n = sum(1 for p in products if p["category"] == cat)
        print(f"  {cat}: {n} products")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/build-catalog.py <path-to-xlsx>")
        sys.exit(1)
    main(sys.argv[1])

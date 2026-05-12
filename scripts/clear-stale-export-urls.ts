// One-time cleanup: null out exported_pdf_url for any brief whose URL
// points to the dead /exports/<id>/... path (pre-Supabase-Storage). Old
// URLs from local dev got persisted when briefs were exported before the
// Storage migration; clicking Download PDF on those now 404s.
//
// After this runs, those briefs show "Not exported yet — click Export"
// on the Detail page until someone re-exports them from the browser.

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

const envPath = path.join(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data, error } = await supa
    .from("briefs")
    .select("id, exported_pdf_url, data")
    .not("exported_pdf_url", "is", null);
  if (error) throw error;
  let cleared = 0;
  for (const row of data ?? []) {
    const url = row.exported_pdf_url as string;
    if (url.startsWith("/exports/")) {
      const { error: updErr } = await supa
        .from("briefs")
        .update({ exported_pdf_url: null, exported_flowchart_url: null })
        .eq("id", row.id);
      if (updErr) {
        console.log(`  ✗ ${row.id.slice(0, 8)}: ${updErr.message}`);
      } else {
        const proj = (row.data as { projectName?: string })?.projectName ?? "";
        console.log(`  ✓ cleared stale URL: ${row.id.slice(0, 8)} (${proj})`);
        cleared++;
      }
    }
  }
  console.log(`\nCleared ${cleared} stale URL(s).`);
}
main().catch((e) => { console.error(e); process.exit(1); });

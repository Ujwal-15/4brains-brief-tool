// Dumps the latest 5 briefs with each activity's aiFlowchart + userJourney
// lengths, so we can see why the PDF export skipped flowcharts.
import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

const envPath = path.join(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data, error } = await supa
    .from("briefs")
    .select("id, data, updated_at, exported_pdf_url")
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  for (const row of data ?? []) {
    const d = row.data as {
      projectName?: string;
      activities?: Array<{
        productId?: string;
        userJourney?: string;
        aiFlowchart?: string;
      }>;
    };
    console.log(`\n--- ${row.id.slice(0, 8)} ${d.projectName ?? "(no name)"} ---`);
    console.log(`  updated: ${row.updated_at}`);
    console.log(`  exported_pdf_url: ${row.exported_pdf_url ?? "(none)"}`);
    const acts = d.activities ?? [];
    console.log(`  activities: ${acts.length}`);
    acts.forEach((a, i) => {
      const fc = (a.aiFlowchart ?? "").trim();
      const uj = (a.userJourney ?? "").trim();
      console.log(
        `    ${i + 1}. product=${a.productId ?? "(empty)"}  aiFlowchart=${
          fc ? `${fc.length} chars` : "EMPTY"
        }  userJourney=${uj ? `${uj.length} chars` : "EMPTY"}`,
      );
    });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

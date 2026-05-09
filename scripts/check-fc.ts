// Read aiFlowchart fields from each seeded brief — verifies the seed
// actually persisted Mermaid sources to the DB.
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
    .select("id, data")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  for (const row of data ?? []) {
    const d = row.data as { activities?: { productId: string; aiFlowchart?: string }[] };
    const acts = d?.activities ?? [];
    console.log(`Brief ${row.id.slice(0, 8)} — ${acts.length} activities`);
    acts.forEach((a, i) => {
      const fc = (a.aiFlowchart || "").trim();
      console.log(
        `  ${i + 1}. productId=${a.productId.padEnd(28)} aiFlowchart=${fc ? `${fc.length} chars` : "EMPTY"}`,
      );
      if (fc && i === 0) {
        console.log("     first 200 chars:", JSON.stringify(fc.slice(0, 200)));
      }
    });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

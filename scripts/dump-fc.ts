// Dump the aiFlowchart content for the Target Family Day brief.
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
  const { data } = await supa
    .from("briefs")
    .select("id, data")
    .eq("id", "e2c6f6fd-b835-4526-82f4-968d406b2f3d")
    .maybeSingle();
  const a = (data?.data as { activities?: Array<{ aiFlowchart?: string; userJourney?: string }> })
    ?.activities?.[0];
  console.log("=== aiFlowchart raw ===");
  console.log(a?.aiFlowchart);
  console.log("\n=== userJourney raw ===");
  console.log(a?.userJourney);
}
main().catch((e) => { console.error(e); process.exit(1); });

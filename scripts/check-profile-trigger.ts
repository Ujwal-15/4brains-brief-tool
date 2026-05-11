// Checks whether the Supabase 'handle_new_user' trigger is wired up. If
// it's NOT, the first new signup will succeed at auth but no row will
// appear in public.profiles, breaking the dashboard immediately.
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
  const { count: profileCount } = await supa
    .from("profiles")
    .select("*", { count: "exact", head: true });
  console.log(`profiles row count: ${profileCount}`);

  const { data: profiles } = await supa
    .from("profiles")
    .select("*")
    .limit(5);
  console.log("Sample profiles:");
  profiles?.forEach((p) => {
    console.log(
      `  - ${(p.id as string).slice(0, 8)}  name="${p.name}" role=${
        (p as { role?: string }).role ?? "(null)"
      }`,
    );
  });

  if (profiles && profiles.length > 0) {
    console.log("\nprofiles columns:", Object.keys(profiles[0]).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

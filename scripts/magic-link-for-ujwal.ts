// Generates a one-time magic link for ujwal@4brains.in directly via the
// admin API and prints the URL to terminal. Bypasses Supabase's email
// service entirely — paste the URL in a browser, you're signed in.
//
// Run once:
//   unset ANTHROPIC_API_KEY && npx tsx scripts/magic-link-for-ujwal.ts

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

const EMAIL = "ujwal@4brains.in";
const PROD_URL = "https://4brains-brief-tool.vercel.app";

async function main() {
  const { data, error } = await supa.auth.admin.generateLink({
    type: "magiclink",
    email: EMAIL,
    options: { redirectTo: `${PROD_URL}/` },
  });
  if (error) {
    console.error("Admin generateLink failed:", error.message);
    process.exit(1);
  }
  const link = data?.properties?.action_link;
  if (!link) {
    console.error("No action_link in response:", JSON.stringify(data));
    process.exit(1);
  }
  console.log("\n=== PASTE THIS LINK IN YOUR BROWSER ===\n");
  console.log(link);
  console.log("\n=======================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

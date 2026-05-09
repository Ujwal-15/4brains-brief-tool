// Idempotent setup for the Supabase Storage bucket that holds exported
// brief PDFs. Safe to run multiple times.
//
// Run with:
//   unset ANTHROPIC_API_KEY && npx tsx scripts/setup-storage.ts

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env so the service-role key is available outside Next.
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const BUCKET = "briefs";

const supa = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Look up existing buckets first.
  const { data: existing, error: listErr } = await supa.storage.listBuckets();
  if (listErr) throw listErr;

  const found = existing?.find((b) => b.name === BUCKET);
  if (found) {
    console.log(`✓ Bucket '${BUCKET}' already exists (public=${found.public})`);
  } else {
    const { error } = await supa.storage.createBucket(BUCKET, {
      // Private — every download goes through our auth-checked /api/briefs/[id]/pdf
      // proxy. Stops anyone with a guessed URL from grabbing PDFs.
      public: false,
      fileSizeLimit: "25MB",
      allowedMimeTypes: ["application/pdf"],
    });
    if (error) throw error;
    console.log(`✓ Created private bucket '${BUCKET}'`);
  }

  console.log(
    "\nStorage is ready. PDFs will be uploaded by the export route to\n  " +
      `${BUCKET}/{briefId}/{filename}.pdf\n` +
      "and served back to authenticated users via /api/briefs/[id]/pdf.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

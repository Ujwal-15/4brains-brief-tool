// Pre-creates auth accounts for the 4Brains pilot team. Idempotent —
// if a user already exists (e.g. ujwal@4brains.in from earlier testing),
// we update their password instead of failing.
//
// Run once:
//   unset ANTHROPIC_API_KEY && npx tsx scripts/create-team-accounts.ts

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

const STARTER_PASSWORD = "Admin@2026";

const TEAM: Array<{ email: string; name: string }> = [
  { email: "sanjeev@4brains.in",        name: "Sanjeev Sinha" },
  { email: "alok@4brains.in",           name: "Alok Kumar" },
  { email: "sumit@4brains.in",          name: "Sumit Bhadani" },
  { email: "pawan@4brains.in",          name: "Pawan Kumar" },
  { email: "varsha@4brains.in",         name: "Varsha Sundariyal" },
  { email: "akash@4brains.in",          name: "Akash Sandis" },
  { email: "aman@4brains.in",           name: "Aman Sharma" },
  { email: "pooja@4brains.in",          name: "Pooja Kumari" },
  { email: "rakesh@4brains.in",         name: "Rakesh Rao" },
  { email: "ujwal@4brains.in",          name: "Ujwal Hannehra" },
  { email: "sushant@4brains.in",        name: "Sushant Shekhar" },
  { email: "himanshu.b@4brains.in",     name: "Himanshu Bisht" },
  { email: "shashank@4brains.in",       name: "Shashank A S" },
  { email: "nidhisha.k@4brains.in",     name: "Nidhisha K" },
  { email: "aditi.priya@4brains.in",    name: "Aditi Priya" },
  { email: "nikhil.kumar@4brains.in",   name: "Nikhil Kumar" },
];

// Find an existing user by email. We page through admin.listUsers since
// there's no direct admin getUserByEmail in the SDK.
async function findUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  while (true) {
    const { data, error } = await supa.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const hit = data.users.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 20) return null; // safety
  }
}

async function upsertUser(email: string, name: string) {
  // Try to create.
  const { error: createErr } = await supa.auth.admin.createUser({
    email,
    password: STARTER_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });

  if (!createErr) {
    return { email, status: "created" as const };
  }

  // Already exists? Update password + metadata instead.
  const msg = createErr.message.toLowerCase();
  if (msg.includes("already") || msg.includes("registered") || msg.includes("duplicate")) {
    const id = await findUserIdByEmail(email);
    if (!id) {
      return { email, status: "failed" as const, error: "exists but id lookup failed" };
    }
    const { error: updErr } = await supa.auth.admin.updateUserById(id, {
      password: STARTER_PASSWORD,
      email_confirm: true,
      user_metadata: { name },
    });
    if (updErr) {
      return { email, status: "failed" as const, error: updErr.message };
    }
    return { email, status: "updated" as const };
  }

  return { email, status: "failed" as const, error: createErr.message };
}

async function main() {
  console.log(`Creating/updating ${TEAM.length} accounts...\n`);

  const results: Array<{
    email: string;
    status: "created" | "updated" | "failed";
    error?: string;
  }> = [];

  for (const member of TEAM) {
    const r = await upsertUser(member.email, member.name);
    results.push(r);
    const icon =
      r.status === "created" ? "✓ new" : r.status === "updated" ? "↺ reset" : "✗ FAIL";
    console.log(`  ${icon}  ${member.email.padEnd(28)} ${r.error || ""}`);
  }

  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\nDone — ${created} new, ${updated} reset, ${failed} failed`);
  console.log(`\nAll accounts now have password: ${STARTER_PASSWORD}`);
  console.log(`Share this with the team along with the URL.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

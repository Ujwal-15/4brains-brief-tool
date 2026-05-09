// Bootstraps the initial admin and PM users via Supabase Admin API.
// Idempotent — re-running with the same emails is a no-op (existing users
// are detected and left alone).
//
// Run with: npm run db:bootstrap
//
// Required env (from .env): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY.
// Profile rows are created automatically by the on_auth_user_created
// trigger, which reads `name` and `role` from raw_user_meta_data.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "PM" | "CS_BD";
};

const SEED_USERS: SeedUser[] = [
  {
    email: "ujwal@4brains.in",
    password: "ujwal123",
    name: "Ujwal",
    role: "ADMIN",
  },
  {
    email: "priya@4brains.in",
    password: "priya123",
    name: "Priya",
    role: "PM",
  },
];

async function findUserByEmail(email: string) {
  // listUsers paginates; for ~2 users this is fine without paging.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

async function ensureUser(seed: SeedUser) {
  const existing = await findUserByEmail(seed.email);
  if (existing) {
    console.log(`exists  ${seed.email}  (${existing.id})`);
    return;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
    user_metadata: { name: seed.name, role: seed.role },
  });
  if (error) throw error;
  console.log(`created ${seed.email}  (${data.user?.id})`);
}

async function main() {
  for (const user of SEED_USERS) {
    await ensureUser(user);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

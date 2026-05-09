import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS — use only for trusted
// server-side operations: seed scripts, the export route, admin-only flows.
// NEVER import this from a client component or any code that ships to the
// browser. The "server-only" import will fail the build if someone tries.
let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return cached;
}

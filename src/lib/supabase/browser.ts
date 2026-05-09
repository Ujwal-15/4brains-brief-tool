"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client. Reads the auth cookie from the browser cookie jar.
// Use in client components only — server components must use ./server.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

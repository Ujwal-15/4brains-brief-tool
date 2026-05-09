"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ThemeToggle } from "./ThemeToggle";

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header({ name, email }: { name: string; email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-support shadow-glow-primary"
          >
            <span className="font-display text-[13px] italic leading-none text-white">
              4
            </span>
          </span>
          <span className="text-[13px] font-medium tracking-tight text-ink-on-page">
            4Brains
            <span className="ml-1.5 text-ink-on-page/55">Brief Tool</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[11px] font-semibold tracking-wide text-ink ring-2 ring-page"
            title={name}
            aria-label={`Signed in as ${name}`}
          >
            {initials(name, email)}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-ink-on-page/15 bg-ink-on-page/5 px-3.5 py-1.5 text-xs font-medium text-ink-on-page/80 transition-colors hover:bg-ink-on-page/10 hover:text-ink-on-page"
          >
            Log out
          </button>
        </div>
      </div>
      {/* Brand gradient hairline */}
      <div aria-hidden className="brand-line" />
    </header>
  );
}

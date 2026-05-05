"use client";

import { signOut, useSession } from "next-auth/react";

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">
            4Brains Brief Tool
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
            title={name}
            aria-label={`Signed in as ${name}`}
          >
            {initials(session?.user?.name, session?.user?.email)}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

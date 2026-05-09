"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BriefRow } from "@/lib/briefs";

export function Dashboard({ briefs }: { briefs: BriefRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return briefs;
    return briefs.filter(
      (b) =>
        b.projectName.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q),
    );
  }, [briefs, query]);

  const totalCount = briefs.length;
  const filteredCount = filtered.length;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-hero hero-panel px-7 py-12 shadow-elevated ring-1 ring-ink-on-page/[0.06] sm:px-10 sm:py-14">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="eyebrow">Workspace</div>
            <h1 className="h-display text-ink-on-page">
              Briefs,{" "}
              <span className="italic text-support">crafted</span>{" "}
              for clarity.
            </h1>
            {totalCount > 0 && (
              <p className="text-sm text-ink-on-page/60">
                <span className="text-ink-on-page">{totalCount}</span> brief
                {totalCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <Link
            href="/briefs/new"
            className="group inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-glow-primary transition-all hover:-translate-y-px hover:bg-primary-hover sm:self-auto"
          >
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs leading-none transition-transform group-hover:rotate-90"
            >
              +
            </span>
            <span>New Brief</span>
          </Link>
        </div>
      </section>

      {/* Search — status filters removed (no use yet) */}
      <div className="flex justify-end">
        <div className="sm:w-72">
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-on-page/45"
            >
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search briefs"
              className="w-full rounded-full border border-ink-on-page/15 bg-ink-on-page/5 py-2 pl-9 pr-4 text-[13px] text-ink-on-page placeholder:text-ink-on-page/45 outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState />
      ) : filteredCount === 0 ? (
        <NoResults onClear={() => setQuery("")} />
      ) : (
        <BriefTable rows={filtered} />
      )}
    </div>
  );
}

function BriefTable({ rows }: { rows: BriefRow[] }) {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
              <th className="px-6 py-4 font-semibold">Project</th>
              <th className="px-6 py-4 font-semibold">Client</th>
              <th className="px-6 py-4 font-semibold">Activities</th>
              <th className="px-6 py-4 font-semibold">Updated</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {rows.map((b) => (
              <tr
                key={b.id}
                className="group transition-colors hover:bg-surface-alt/60"
              >
                <td className="px-6 py-4 font-medium text-ink">
                  <Link
                    href={`/briefs/${b.id}`}
                    className="transition-colors group-hover:text-primary"
                  >
                    {b.projectName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-ink-soft">{b.clientName}</td>
                <td className="px-6 py-4">
                  {b.activityCount > 0 ? (
                    <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-support/10 px-2 text-[11px] font-semibold text-support">
                      {b.activityCount}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft/40">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-[13px] text-ink-soft">
                  {b.updatedAtLabel}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-4 text-[13px] text-ink-soft">
                    <Link
                      href={`/briefs/${b.id}`}
                      className="transition-colors hover:text-primary"
                    >
                      View
                    </Link>
                    <Link
                      href={`/briefs/${b.id}/edit`}
                      className="transition-colors hover:text-primary"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card bg-surface px-8 py-20 text-center shadow-soft">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-support/10 text-2xl text-primary">
        ✦
      </div>
      <p className="font-display text-2xl italic text-ink">
        No briefs yet.
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Click <span className="font-medium text-ink">New Brief</span> to start
        the first one.
      </p>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-card bg-surface px-6 py-14 text-center shadow-soft">
      <p className="text-sm text-ink-soft">No briefs match your search.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-sm font-medium text-primary hover:underline"
      >
        Clear search
      </button>
    </div>
  );
}

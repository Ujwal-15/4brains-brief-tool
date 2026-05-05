"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type BriefRow,
  type BriefStatus,
  STATUS_LABELS,
} from "@/lib/briefs";

type FilterValue = "ALL" | BriefStatus;

const TABS: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "ARCHIVED", label: "Archived" },
];

function StatusBadge({ status }: { status: BriefStatus }) {
  const styles: Record<BriefStatus, string> = {
    DRAFT: "bg-neutral-100 text-neutral-700",
    IN_REVIEW: "bg-accent/15 text-accent",
    APPROVED: "bg-neutral-900 text-white",
    ARCHIVED: "bg-neutral-100 text-neutral-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Dashboard({ briefs }: { briefs: BriefRow[] }) {
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return briefs.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.projectName.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q)
      );
    });
  }, [briefs, filter, query]);

  const totalCount = briefs.length;
  const filteredCount = filtered.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Briefs</h1>
        <Link
          href="/briefs/new"
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <span aria-hidden>+</span>
          <span>New Brief</span>
        </Link>
      </div>

      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="-mx-1 flex items-center gap-1 overflow-x-auto px-1"
          role="tablist"
        >
          {TABS.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.value)}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="sm:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by project or client"
            className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState />
      ) : filteredCount === 0 ? (
        <NoResults onClear={() => { setFilter("ALL"); setQuery(""); }} />
      ) : (
        <BriefTable rows={filtered} />
      )}
    </div>
  );
}

function BriefTable({ rows }: { rows: BriefRow[] }) {
  return (
    <div className="overflow-x-auto rounded border border-neutral-200">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2.5">Project Name</th>
            <th className="px-4 py-2.5">Client</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Last Updated</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 font-medium text-neutral-900">
                <Link href={`/briefs/${b.id}`} className="hover:underline">
                  {b.projectName}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-700">{b.clientName}</td>
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {b.updatedAtLabel}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3 text-sm text-neutral-600">
                  <Link
                    href={`/briefs/${b.id}`}
                    className="hover:text-accent hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/briefs/${b.id}/edit`}
                    className="hover:text-accent hover:underline"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/briefs/${b.id}/export`}
                    className="hover:text-accent hover:underline"
                  >
                    Export
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded border border-dashed border-neutral-300 px-6 py-16 text-center">
      <p className="text-sm text-neutral-600">
        No briefs yet. Click <span className="font-medium">+ New Brief</span> to
        get started.
      </p>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded border border-dashed border-neutral-300 px-6 py-12 text-center">
      <p className="text-sm text-neutral-600">No briefs match these filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-sm text-accent hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

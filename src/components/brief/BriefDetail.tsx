import Link from "next/link";
import type { RenderedSection } from "@/lib/exportSections";
import {
  type BriefStatus,
  STATUS_LABELS,
} from "@/lib/briefs";

type ChangeLogEntry = {
  id: string;
  message: string;
  createdAt: string;
  user: { name: string; email: string };
};

type Props = {
  briefId: string;
  status: BriefStatus;
  projectName: string;
  clientName: string;
  createdByName: string;
  pmName: string | null;
  updatedAtLabel: string;
  exportedPdfUrl: string | null;
  exportedFlowchartUrl: string | null;
  sections: RenderedSection[];
  changeLog: ChangeLogEntry[];
  canEdit: boolean;
};

const statusBadgeStyles: Record<BriefStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  IN_REVIEW: "bg-accent/15 text-accent",
  APPROVED: "bg-neutral-900 text-white",
  ARCHIVED: "bg-neutral-100 text-neutral-400",
};

export function BriefDetail(p: Props) {
  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {p.projectName}
          </h1>
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusBadgeStyles[p.status]}`}
          >
            {STATUS_LABELS[p.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-600">
          <span>
            Client: <span className="text-neutral-900">{p.clientName}</span>
          </span>
          <span>
            Created by{" "}
            <span className="text-neutral-900">{p.createdByName}</span>
          </span>
          {p.pmName && (
            <span>
              PM: <span className="text-neutral-900">{p.pmName}</span>
            </span>
          )}
          <span>Last updated: {p.updatedAtLabel}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {p.canEdit && (
            <Link
              href={`/briefs/${p.briefId}/edit`}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              Edit
            </Link>
          )}
          {p.exportedPdfUrl && (
            <a
              href={p.exportedPdfUrl}
              target="_blank"
              rel="noopener"
              className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Download PDF
            </a>
          )}
          {p.exportedFlowchartUrl && (
            <a
              href={p.exportedFlowchartUrl}
              target="_blank"
              rel="noopener"
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              Download Flowchart
            </a>
          )}
          {!p.exportedPdfUrl && p.canEdit && (
            <span className="self-center text-xs text-neutral-500">
              Not exported yet — open Edit and click Export PDF + Flowchart.
            </span>
          )}
        </div>
      </header>

      {p.sections.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-300 px-6 py-12 text-center">
          <p className="text-sm text-neutral-600">
            This brief has no content yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {p.sections.map((section) => (
            <section
              key={section.index}
              className="rounded border border-neutral-200 bg-white p-5"
            >
              <h2 className="mb-4 border-b border-neutral-200 pb-2 text-base font-semibold tracking-tight">
                {section.index}. {section.title}
              </h2>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {section.rows.map((row, i) => (
                  <div key={i} className="space-y-1">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                      {row.label}
                    </dt>
                    <dd className="whitespace-pre-wrap break-words text-sm text-neutral-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}

      <section className="rounded border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold tracking-tight">
          Change log
        </h2>
        {p.changeLog.length === 0 ? (
          <p className="text-sm text-neutral-500">No changes recorded yet.</p>
        ) : (
          <ol className="space-y-3">
            {p.changeLog.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-3 text-sm"
              >
                <span className="text-neutral-900">{entry.message}</span>
                <span className="text-xs text-neutral-500">
                  by {entry.user.name} · {entry.createdAt}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

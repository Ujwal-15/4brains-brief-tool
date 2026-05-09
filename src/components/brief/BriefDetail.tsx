import Link from "next/link";
import type { RenderedSection } from "@/lib/exportSections";
import { MermaidPreview } from "./MermaidPreview";

type ChangeLogEntry = {
  id: string;
  message: string;
  createdAt: string;
  user: { name: string; email: string };
};

export type BriefSummary = {
  eventDate: string;
  cities: string;
  venue: string;
  activitiesCount: number;
  setupDate: string;
  indoorOutdoor: string;
};

type Props = {
  briefId: string;
  projectName: string;
  clientName: string;
  createdByName: string;
  pmName: string | null;
  updatedAtLabel: string;
  exportedPdfUrl: string | null;
  exportedFlowchartUrl: string | null;
  sections: RenderedSection[];
  summary: BriefSummary;
  changeLog: ChangeLogEntry[];
  canEdit: boolean;
};

// Section accent colors cycle through brand palette so each section card
// has a recognizable left-edge tint and numeral color.
const SECTION_ACCENTS: Record<
  number,
  { numeral: string; bar: string; chip: string }
> = {
  1: { numeral: "text-primary", bar: "bg-primary", chip: "bg-primary/10 text-primary" },
  2: { numeral: "text-support", bar: "bg-support", chip: "bg-support/10 text-support" },
  3: { numeral: "text-secondary", bar: "bg-secondary", chip: "bg-secondary/10 text-secondary" },
  4: { numeral: "text-primary", bar: "bg-primary", chip: "bg-primary/10 text-primary" },
  5: { numeral: "text-support", bar: "bg-support", chip: "bg-support/10 text-support" },
  6: { numeral: "text-ink-soft", bar: "bg-ink-soft/60", chip: "bg-black/[0.04] text-ink-soft" },
};

// Some labels naturally produce long content — give them the whole row.
const LONG_LABELS = new Set([
  "Venue",
  "Description",
  "User Journey",
  "Notes",
  "Spec notes",
  "Deliverables note",
  "Data Notes",
  "Client provides",
  "4Brains will fabricate",
  "1LD notes",
  "4Brains will provide",
  "Client will provide",
  "Brand Colors / Fonts",
  "4Brains Internet Arrangement",
]);

function isLongRow(label: string, value: string): boolean {
  if (LONG_LABELS.has(label)) return true;
  if (value.length > 60) return true;
  if (value.includes("\n")) return true;
  return false;
}

// Pull the activity category out of a rendered activity's first row (the
// renderer puts it there). Returns "" if not present.
function activityCategoryFromRows(rows: { label: string; value: string }[]): string {
  return rows.find((r) => r.label === "Category")?.value ?? "";
}

const CATEGORY_TINTS: Record<string, string> = {
  Registration: "bg-primary/10 text-primary",
  "Interactive & Information": "bg-support/10 text-support",
  "AI Activations": "bg-secondary/10 text-secondary",
  Gamification: "bg-primary/10 text-primary",
  Photobooth: "bg-support/10 text-support",
  Installation: "bg-secondary/10 text-secondary",
  "App Development": "bg-primary/10 text-primary",
  Custom: "bg-ink-soft/15 text-ink-soft",
};

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "primary" | "support" | "secondary";
}) {
  const accentBg = {
    primary: "from-primary/10",
    support: "from-support/10",
    secondary: "from-secondary/10",
  }[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-card bg-surface p-5 shadow-soft`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentBg} to-transparent opacity-60`}
      />
      <div className="relative">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
          {label}
        </div>
        <div className="mt-1.5 break-words text-[15px] font-medium leading-tight text-ink">
          {value || <span className="text-ink-soft/50">—</span>}
        </div>
      </div>
    </div>
  );
}

export function BriefDetail(p: Props) {
  return (
    <div className="space-y-7 pb-12">
      {/* Hero header — navy panel that floats on the navy page */}
      <header className="relative overflow-hidden rounded-hero hero-panel px-7 py-10 shadow-elevated ring-1 ring-ink-on-page/[0.06] sm:px-10 sm:py-12">
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <span className="eyebrow">Project Brief</span>
          </div>

          <h1 className="h-display-sm text-ink-on-page">{p.projectName}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-on-page/55">
            <span>
              Client{" "}
              <span className="font-medium text-ink-on-page">{p.clientName}</span>
            </span>
            <span className="text-ink-on-page/25" aria-hidden>·</span>
            <span>
              CS{" "}
              <span className="font-medium text-ink-on-page">{p.createdByName}</span>
            </span>
            {p.pmName && (
              <>
                <span className="text-ink-on-page/25" aria-hidden>·</span>
                <span>
                  PM{" "}
                  <span className="font-medium text-ink-on-page">{p.pmName}</span>
                </span>
              </>
            )}
            <span className="text-ink-on-page/25" aria-hidden>·</span>
            <span>Updated {p.updatedAtLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {p.canEdit && (
              <Link
                href={`/briefs/${p.briefId}/edit`}
                className="rounded-full border border-ink-on-page/15 bg-ink-on-page/5 px-4 py-1.5 text-[13px] font-medium text-ink-on-page/80 transition-colors hover:bg-ink-on-page/10 hover:text-ink-on-page"
              >
                Edit
              </Link>
            )}
            {p.exportedPdfUrl && (
              <a
                href={p.exportedPdfUrl}
                target="_blank"
                rel="noopener"
                className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-white shadow-glow-primary transition-all hover:-translate-y-px hover:bg-primary-hover"
              >
                Download PDF
              </a>
            )}
            {!p.exportedPdfUrl && (
              <span className="self-center text-xs text-ink-on-page/50">
                Not exported yet — open Edit and click Export.
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Quick-view summary tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile
          label="Event Date"
          value={p.summary.eventDate}
          accent="primary"
        />
        <SummaryTile
          label="Venue / City"
          value={p.summary.cities || p.summary.venue}
          accent="support"
        />
        <SummaryTile
          label="Setup"
          value={
            p.summary.setupDate +
            (p.summary.indoorOutdoor ? ` · ${p.summary.indoorOutdoor}` : "")
          }
          accent="secondary"
        />
        <SummaryTile
          label="Activities"
          value={
            p.summary.activitiesCount > 0
              ? `${p.summary.activitiesCount} planned`
              : ""
          }
          accent="primary"
        />
      </div>

      {p.sections.length === 0 ? (
        <div className="rounded-card bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-sm text-ink-soft">
            This brief has no content yet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {p.sections.map((section) => {
            const accent =
              SECTION_ACCENTS[section.index] ?? SECTION_ACCENTS[6];
            return (
              <section
                key={section.index}
                className="relative overflow-hidden rounded-card bg-surface shadow-soft"
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-[3px] ${accent.bar} opacity-70`}
                />
                <div className="border-b border-black/[0.06] px-7 py-5">
                  <div className="flex items-baseline gap-3">
                    <span
                      className={`font-display text-[18px] italic font-bold tabular-nums ${accent.numeral}`}
                    >
                      {String(section.index).padStart(2, "0")}
                    </span>
                    <h2 className="text-[16px] font-medium tracking-tight text-ink">
                      {section.title}
                    </h2>
                  </div>
                </div>
                <div className="px-7 py-6">
                  {section.rows.length > 0 && (
                    <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                      {section.rows.map((row, i) => {
                        const long = isLongRow(row.label, row.value);
                        return (
                          <div
                            key={i}
                            className={`space-y-1 ${long ? "sm:col-span-2" : ""}`}
                          >
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
                              {row.label}
                            </dt>
                            <dd className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-ink">
                              {row.value}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                  {section.activities && section.activities.length > 0 && (
                    <div className="space-y-4">
                      {section.activities.map((act) => {
                        const category = activityCategoryFromRows(act.rows);
                        const tint =
                          CATEGORY_TINTS[category] ??
                          "bg-ink-soft/15 text-ink-soft";
                        // Show all rows except Category (we render it as a
                        // chip in the header instead — saves a redundant row).
                        const visibleRows = act.rows.filter(
                          (r) => r.label !== "Category",
                        );
                        return (
                          <div
                            key={act.index}
                            className="overflow-hidden rounded-card bg-surface-alt/70 shadow-hairline"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.05] bg-ink-on-page/80 px-5 py-3.5">
                              <div className="flex items-baseline gap-2.5">
                                <span
                                  className={`font-display text-[14px] italic font-bold ${accent.numeral}`}
                                >
                                  {section.index}.{act.index}
                                </span>
                                <h3 className="text-[14px] font-medium tracking-tight text-ink">
                                  {act.title}
                                </h3>
                              </div>
                              {category && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${tint}`}
                                >
                                  {category}
                                </span>
                              )}
                            </div>
                            <div className="space-y-5 px-5 py-5">
                              <dl className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                                {visibleRows.map((row, i) => {
                                  const long = isLongRow(row.label, row.value);
                                  return (
                                    <div
                                      key={i}
                                      className={`space-y-1 ${long ? "sm:col-span-2" : ""}`}
                                    >
                                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
                                        {row.label}
                                      </dt>
                                      <dd className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink">
                                        {row.value}
                                      </dd>
                                    </div>
                                  );
                                })}
                              </dl>
                              {act.aiFlowchart && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft/70">
                                    <span>User Journey Flowchart</span>
                                    <span
                                      className="h-px flex-1 bg-ink-soft/15"
                                      aria-hidden
                                    />
                                  </div>
                                  <div className="overflow-hidden rounded-card bg-white p-5 shadow-hairline">
                                    <MermaidPreview source={act.aiFlowchart} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="overflow-hidden rounded-card bg-surface shadow-soft">
        <div className="border-b border-black/[0.06] px-7 py-4">
          <h2 className="text-[15px] font-medium tracking-tight text-ink">
            Change log
          </h2>
        </div>
        <div className="px-7 py-6">
          {p.changeLog.length === 0 ? (
            <p className="text-sm text-ink-soft">No changes recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {p.changeLog.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-3 text-sm"
                >
                  <span className="text-ink">{entry.message}</span>
                  <span className="text-xs text-ink-soft">
                    by {entry.user.name} · {entry.createdAt}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

// 3-state lifecycle. Briefs start as DRAFT, auto-flip to FINAL on first
// Export, and can be manually ARCHIVED to hide from active view. There is
// no review/approval workflow — anyone in the team can fill, export, and
// share a brief.
export type BriefStatus = "DRAFT" | "FINAL" | "ARCHIVED";

export type BriefRow = {
  id: string;
  status: BriefStatus;
  projectName: string;
  clientName: string;
  activityCount: number;
  updatedAtLabel: string;
  updatedAtISO: string;
};

export const STATUS_LABELS: Record<BriefStatus, string> = {
  DRAFT: "Draft",
  FINAL: "Final",
  ARCHIVED: "Archived",
};

// Accepts either a JSON string (legacy) or an object (jsonb from Supabase).
type BriefSummaryShape = {
  projectName?: unknown;
  clientName?: unknown;
  activities?: unknown;
};

export function parseBriefData(raw: unknown): {
  projectName: string;
  clientName: string;
  activityCount: number;
} {
  let parsed: BriefSummaryShape | null = null;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as BriefSummaryShape;
    } catch {
      return { projectName: "Untitled brief", clientName: "—", activityCount: 0 };
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw as BriefSummaryShape;
  }

  if (!parsed)
    return { projectName: "Untitled brief", clientName: "—", activityCount: 0 };

  const projectName =
    typeof parsed.projectName === "string" && parsed.projectName.trim()
      ? parsed.projectName
      : "Untitled brief";
  const clientName =
    typeof parsed.clientName === "string" && parsed.clientName.trim()
      ? parsed.clientName
      : "—";
  // Count only activities that have a product picked — a fresh blank
  // EMPTY_ACTIVITY shouldn't bump the count to 1.
  const activityCount = Array.isArray(parsed.activities)
    ? parsed.activities.filter((a) => {
        if (!a || typeof a !== "object") return false;
        const pid = (a as { productId?: unknown }).productId;
        return typeof pid === "string" && pid.trim().length > 0;
      }).length
    : 0;
  return { projectName, clientName, activityCount };
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatBriefDate(d: Date): string {
  return DATE_FMT.format(d);
}

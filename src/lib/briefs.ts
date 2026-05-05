export type BriefStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED";

export type BriefRow = {
  id: string;
  status: BriefStatus;
  projectName: string;
  clientName: string;
  updatedAtLabel: string;
  updatedAtISO: string;
};

export const STATUS_LABELS: Record<BriefStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  ARCHIVED: "Archived",
};

export function parseBriefData(raw: string): {
  projectName: string;
  clientName: string;
} {
  try {
    const parsed = JSON.parse(raw) as {
      projectName?: unknown;
      clientName?: unknown;
    };
    const projectName =
      typeof parsed.projectName === "string" && parsed.projectName.trim()
        ? parsed.projectName
        : "Untitled brief";
    const clientName =
      typeof parsed.clientName === "string" && parsed.clientName.trim()
        ? parsed.clientName
        : "—";
    return { projectName, clientName };
  } catch {
    return { projectName: "Untitled brief", clientName: "—" };
  }
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatBriefDate(d: Date): string {
  return DATE_FMT.format(d);
}

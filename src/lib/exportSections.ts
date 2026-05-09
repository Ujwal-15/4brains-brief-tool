// Field defs that drive both the PDF export and the read-only Brief Detail
// view.

import type { Activity, BriefFormData } from "./briefSchema";
import { activityCategory, activityDisplayName } from "./briefSchema";

export type ExportContext = {
  pmName: string;
  csName: string;
};

export type ExportRow = { label: string; value: string };

const yn = (b: boolean) => (b ? "Yes" : "No");
const list = (xs: string[]) => xs.join(", ");

function row(
  label: string,
  value: string | null | undefined,
): ExportRow | null {
  if (!value || !value.trim()) return null;
  return { label, value: value.trim() };
}

function compact(rows: (ExportRow | null)[]): ExportRow[] {
  return rows.filter((r): r is ExportRow => r !== null);
}

// ---------- Event-level sections ----------

function section1Rows(d: BriefFormData, ctx: ExportContext): ExportRow[] {
  return compact([
    row("Client / Brand", d.clientName),
    row("Project / Event", d.projectName),
    row("POC Name", d.pocName),
    row("POC Phone", d.pocPhone),
    row("CS/BD Owner", ctx.csName || d.csbdOwner),
    row("PM Assigned", d.pmName || ctx.pmName),
    row("Brief Received On", formatDate(d.briefReceivedOn)),
  ]);
}

// Format an ISO date (YYYY-MM-DD) into "Mon DD, YYYY" — falls back to the raw
// string if it doesn't parse.
function formatDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(from: string, to: string): string {
  const f = formatDate(from);
  const t = formatDate(to);
  if (f && t && f !== t) return `${f} – ${t}`;
  return f || t || "";
}

function section2Rows(d: BriefFormData): ExportRow[] {
  return compact([
    row("Event Date(s)", formatDateRange(d.eventDateFrom, d.eventDateTo)),
    row("City / Cities", d.cities),
    row("Venue", d.venueAddress),
    row("Indoor / Outdoor", d.indoorOutdoor),
    row("Setup Date", formatDateRange(d.setupDateFrom, d.setupDateTo)),
    row("Demo Date(s)", formatDateRange(d.demoDateFrom, d.demoDateTo)),
  ]);
}

function section4Rows(d: BriefFormData): ExportRow[] {
  return compact([
    {
      label: "Design / Brand Guidelines Source",
      value: d.clientProvidesDesign
        ? "Client provides"
        : "4Brains internal style",
    },
    d.clientProvidesDesign
      ? {
          label: "Brand Guidelines Shared",
          value: yn(d.brandGuidelinesSharedYet),
        }
      : null,
    d.clientProvidesDesign && !d.brandGuidelinesSharedYet
      ? row("Follow-up flagged", d.brandGuidelinesFollowUp)
      : null,
    { label: "Logo Files Received", value: yn(d.logoFilesReceived) },
    row("Brand Colors / Fonts", d.brandColorsFonts),
    d.slotDayDesignVariations
      ? row("Slot/Day Variations", d.slotDayDesignVariationsNotes)
      : null,
  ]);
}

function section5Rows(d: BriefFormData): ExportRow[] {
  return compact([
    { label: "Fabrication — Client side", value: yn(d.fabricationByClient) },
    d.fabricationByClient
      ? row("Client provides", d.fabricationClientNotes)
      : null,
    {
      label: "Fabrication — 4Brains side",
      value: yn(d.fabricationByFourBrains),
    },
    d.fabricationByFourBrains
      ? row("4Brains will fabricate", d.fabricationFourBrainsNotes)
      : null,
    {
      label: "One-line Diagram (1LD)",
      value: yn(d.oneLineDiagramRequired),
    },
    d.oneLineDiagramRequired
      ? row("1LD notes", d.oneLineDiagramNotes)
      : null,
    { label: "Internet Provided by Client", value: yn(d.internetByClient) },
    d.internetByClient
      ? row("Speed & Type", d.internetClientDetails)
      : row("4Brains Internet Arrangement", d.internetFourBrainsArrangement),
  ]);
}

function section6Rows(d: BriefFormData): ExportRow[] {
  return compact([row("Notes", d.additionalNotes)]);
}

// ---------- Per-activity rows (Section 3) ----------

export function activityRows(a: Activity): ExportRow[] {
  return compact([
    row("Category", activityCategory(a)),
    row("Activity", activityDisplayName(a)),
    row("Number of stations / units", a.stationCount),
    row("Description", a.description),
    row("User Journey", a.userJourney),
    a.communicationFlows.length
      ? {
          label: "Communication / Invite Flow",
          value: list(a.communicationFlows),
        }
      : null,
    a.fourBrainsDeliverables.length
      ? {
          label: "4Brains will provide",
          value: list(a.fourBrainsDeliverables),
        }
      : null,
    a.clientDeliverables.length
      ? { label: "Client will provide", value: list(a.clientDeliverables) }
      : null,
    row("Deliverables note", a.deliverablesNote),
    row("Spec notes", a.specNotes),
    { label: "User Data Captured", value: yn(a.userDataCaptured) },
    a.userDataCaptured ? row("Data Fields", a.dataFields) : null,
    a.userDataCaptured ? row("How Shared Back", a.dataSharedBack) : null,
    {
      label: "Client Provides Pre-existing Data",
      value: yn(a.clientProvidesData),
    },
    a.clientProvidesData ? row("Data Format", a.dataFormat) : null,
    a.clientProvidesData ? row("Data Notes", a.dataNotes) : null,
  ]);
}

// ---------- Top-level rendering ----------

export type RenderedActivity = {
  index: number;
  title: string;
  rows: ExportRow[];
  aiFlowchart: string;
};

export type RenderedSection = {
  index: number;
  title: string;
  rows: ExportRow[];
  activities?: RenderedActivity[];
};

export function renderSectionsForExport(
  data: BriefFormData,
  ctx: ExportContext,
): RenderedSection[] {
  const out: RenderedSection[] = [];

  const s1 = section1Rows(data, ctx);
  if (s1.length) out.push({ index: 1, title: "Project & Client Info", rows: s1 });

  const s2 = section2Rows(data);
  if (s2.length) out.push({ index: 2, title: "Event Schedule & Venue", rows: s2 });

  const activities: RenderedActivity[] = (data.activities ?? [])
    .map((a, i) => ({
      index: i + 1,
      title: activityDisplayName(a) || `Activity ${i + 1}`,
      rows: activityRows(a),
      aiFlowchart: a.aiFlowchart ?? "",
    }))
    .filter((r) => r.rows.length > 0);
  if (activities.length) {
    out.push({ index: 3, title: "Activities", rows: [], activities });
  }

  const s4 = section4Rows(data);
  if (s4.length) out.push({ index: 4, title: "Design & Branding", rows: s4 });

  const s5 = section5Rows(data);
  if (s5.length) out.push({ index: 5, title: "Fabrication & On-site", rows: s5 });

  const s6 = section6Rows(data);
  if (s6.length) out.push({ index: 6, title: "Additional Notes", rows: s6 });

  return out;
}

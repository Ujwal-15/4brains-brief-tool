// Definitions of which fields belong to which section in the exported PDF.
// Each row is a function that returns { label, value } or null to skip.
//
// `extra` carries server-resolved bits the form blob doesn't have natively
// (PM display name, CS owner from session, etc.).

import type { BriefFormData } from "./briefSchema";

export type ExportContext = {
  pmName: string;
  csName: string;
};

export type ExportRow = { label: string; value: string };

export type ExportSection = {
  index: number;
  title: string;
  rows: (
    d: BriefFormData,
    ctx: ExportContext,
  ) => (ExportRow | null)[];
};

const yn = (b: boolean) => (b ? "Yes" : "No");
const list = (xs: string[]) => xs.join(", ");
const text = (s: string | undefined | null) =>
  s && s.trim() ? s.trim() : null;

function row(label: string, value: string | null | undefined): ExportRow | null {
  if (!value || !value.trim()) return null;
  return { label, value: value.trim() };
}

export const EXPORT_SECTIONS: ExportSection[] = [
  {
    index: 1,
    title: "Project & Client Info",
    rows: (d, ctx) => [
      row("Client / Brand", d.clientName),
      row("Project / Event", d.projectName),
      row("POC Name", d.pocName),
      row("POC Designation", d.pocDesignation),
      row("POC Phone", d.pocPhone),
      row("POC Email", d.pocEmail),
      row("CS/BD Owner", ctx.csName || d.csbdOwner),
      row("PM Assigned", ctx.pmName),
      row("Brief Received On", d.briefReceivedOn),
      row("Brief Received Via", d.briefReceivedVia),
    ],
  },
  {
    index: 2,
    title: "Event Schedule & Venue",
    rows: (d) => [
      row("Event Date(s)", d.eventDates),
      row("City / Cities", d.cities),
      row("Venue", d.venueAddress),
      row("Indoor / Outdoor", d.indoorOutdoor),
      row("Event Times per slot", d.eventTimes),
      row("Setup Date & Time", d.setupDateTime),
      row("Setup Duration", d.setupDuration),
      row("Dismantle Date & Time", d.dismantleDateTime),
      d.demoRequired
        ? row("Demo Date & Time", d.demoDateTime)
        : null,
      row("Venue Access Notes", d.venueAccessNotes),
    ],
  },
  {
    index: 3,
    title: "Activity Overview",
    rows: (d) => [
      row("Category", d.category),
      d.category === "New / Custom Activity"
        ? row("Custom Activity Name", d.activityCustomName)
        : row("Activity", d.activityType),
      row("Activity Name", d.activityName),
      row("Number of Activities", d.activityCount),
      row("Activity Description", d.activityDescription),
      d.outputDevices.length
        ? { label: "Output Devices", value: list(d.outputDevices) }
        : null,
      d.outputDevices.includes("TV Screen")
        ? row("TV Size", d.tvSize)
        : null,
      d.outputDevices.includes("LED Screen")
        ? row("LED Pixel Pitch", d.ledPixelPitch)
        : null,
      d.outputDevices.includes("LED Screen")
        ? row("LED Dimensions", d.ledDimensions)
        : null,
      { label: "Print Required", value: yn(d.printRequired) },
      d.printRequired ? row("Print Size", d.printSize) : null,
      d.printRequired ? row("Total Prints", d.printTotal) : null,
      d.printRequired
        ? row("Print Orientation", d.printOrientation)
        : null,
      d.printRequired
        ? {
            label: "Pre-printed Templates from Client",
            value: yn(d.printPreTemplates),
          }
        : null,
      d.outputFormats.length
        ? { label: "Output Format", value: list(d.outputFormats) }
        : null,
      d.category === "Registration" && d.communicationFlows.length
        ? {
            label: "Communication / Invite Flow",
            value: list(d.communicationFlows),
          }
        : null,
      d.referenceAttachments.length
        ? {
            label: "Reference Attachments",
            value: list(d.referenceAttachments),
          }
        : null,
    ],
  },
  {
    index: 4,
    title: "User Journey",
    rows: (d) => [
      row("Steps", d.userJourney),
      row("Custom Flowchart File", d.customFlowchart),
    ],
  },
  {
    index: 5,
    title: "Client Requirements",
    rows: (d) => [
      row("What the client wants", d.clientWants),
      row("Must-haves / non-negotiables", d.mustHaves),
      row("Things client said NO to", d.thingsClientSaidNo),
      row("Reference links / mood boards", d.referenceLinks),
      d.referenceMoodFiles.length
        ? {
            label: "Reference Files",
            value: list(d.referenceMoodFiles),
          }
        : null,
    ],
  },
  {
    index: 6,
    title: "Design & Branding",
    rows: (d) => [
      { label: "Brand Guidelines Shared", value: yn(d.brandGuidelinesShared) },
      d.brandGuidelinesShared
        ? row("Brand Guidelines File", d.brandGuidelinesFile)
        : row("Follow-up flagged", d.brandGuidelinesFollowUp),
      { label: "Logo Files Received", value: yn(d.logoFilesReceived) },
      d.logoFilesReceived && d.logoFiles.length
        ? { label: "Logo Files", value: list(d.logoFiles) }
        : null,
      row("Brand Colors / Fonts", d.brandColorsFonts),
      d.slotDayDesignVariations
        ? row("Slot/Day Variations", d.slotDayDesignVariationsNotes)
        : null,
    ],
  },
  {
    index: 7,
    title: "Data & Personalization",
    rows: (d) => [
      { label: "User Data Captured", value: yn(d.userDataCaptured) },
      d.userDataCaptured ? row("Data Fields", d.dataFields) : null,
      d.userDataCaptured
        ? row("How Shared Back", d.dataSharedBack)
        : null,
      {
        label: "Client Provides Pre-existing Data",
        value: yn(d.clientProvidesData),
      },
      d.clientProvidesData ? row("Data Format", d.dataFormat) : null,
      d.clientProvidesData
        ? row("Sample File", d.dataSampleFile)
        : null,
      d.clientProvidesData ? row("Data Notes", d.dataNotes) : null,
    ],
  },
  {
    index: 8,
    title: "Fabrication & On-site",
    rows: (d) => [
      { label: "Fabrication Required", value: yn(d.fabricationRequired) },
      d.fabricationRequired
        ? row("Fabrication Notes", d.fabricationNotes)
        : null,
      d.fabricationRequired
        ? {
            label: "Line Diagram Required",
            value: yn(d.lineDiagramRequired),
          }
        : null,
      { label: "Internet Provided by Client", value: yn(d.internetByClient) },
      d.internetByClient
        ? row("Speed & Type", d.internetClientDetails)
        : row("4Brains Internet Arrangement", d.internetFourBrainsArrangement),
    ],
  },
  {
    index: 9,
    title: "Deliverables",
    rows: (d) => [
      row("What Client Will Provide", d.clientWillProvide),
      row("What 4Brains Will Provide", d.fourBrainsWillProvide),
    ],
  },
  {
    index: 10,
    title: "Timeline",
    rows: (d) => [
      row("Demo Date", d.timelineDemoDate),
      row("Setup Date", d.timelineSetupDate),
      row("Final Deadline", d.timelineFinalDeadline),
    ],
  },
  {
    index: 11,
    title: "Additional Notes",
    rows: (d) => [row("Notes", d.additionalNotes)],
  },
];

export type RenderedSection = {
  index: number;
  title: string;
  rows: ExportRow[];
};

export function renderSectionsForExport(
  data: BriefFormData,
  ctx: ExportContext,
): RenderedSection[] {
  return EXPORT_SECTIONS.map((s) => ({
    index: s.index,
    title: s.title,
    rows: s.rows(data, ctx).filter((r): r is ExportRow => r !== null),
  })).filter((s) => s.rows.length > 0);
}

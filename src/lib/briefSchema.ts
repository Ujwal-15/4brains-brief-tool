// Brief form data shape, completion checks, validation.
//
// Activities are catalog-driven now (see ./catalog.ts) — picking a product
// auto-populates 4Brains/Client deliverables. The form's per-activity fields
// have been radically simplified to lean on the catalog as source of truth.

import {
  CATALOG_CATEGORIES,
  CUSTOM_PRODUCT_ID,
  PRODUCT_CATALOG,
  findProduct,
} from "./catalog";

export {
  CATALOG_CATEGORIES,
  CUSTOM_PRODUCT_ID,
  PRODUCT_CATALOG,
  findProduct,
};

export const INDOOR_OUTDOOR_OPTIONS = ["Indoor", "Outdoor", "Both"] as const;

export const COMMUNICATION_FLOWS = [
  "Email plain",
  "Email + Attachment",
  "Email + QR",
  "WhatsApp",
  "WhatsApp + Attachment",
  "WhatsApp + QR",
  "SMS",
  "Microsite",
  "Physical invite",
] as const;

export const DATA_FORMATS = ["Excel", "CSV", "API"] as const;

// ---------- Activity-level fields ----------
//
// One Activity = one distinct activity at the event. Catalog tells us what
// that activity normally involves (devices, deliverables); the form captures
// what's specific to THIS brief (qty, journey, data flow, overrides).
export type Activity = {
  // Catalog product id, or CUSTOM_PRODUCT_ID for off-catalog activities.
  productId: string;
  customProductName: string;

  // Optional CS-chosen display label (overrides the product name).
  customLabel: string;

  stationCount: string;
  description: string;

  userJourney: string;

  // Optional, always shown — used for any activity with an invitation flow.
  communicationFlows: string[];

  // Per-activity data block
  userDataCaptured: boolean;
  dataFields: string;
  dataSharedBack: string;
  clientProvidesData: boolean;
  dataFormat: string;
  dataNotes: string;

  // Deliverables — prefilled from the catalog on pick, fully editable.
  fourBrainsDeliverables: string[];
  clientDeliverables: string[];
  deliverablesNote: string;

  // Anything spec-y that doesn't fit elsewhere (TV size, LED pitch, print
  // orientation, etc.) lands here as a single optional textarea.
  specNotes: string;

  // LLM-generated Mermaid flowchart spec, set by the "Suggest draft" button.
  // When present, the activity's flowchart preview renders this instead of
  // the keyword-classifier output. Cleared by clicking Suggest again
  // (overwritten with a fresh one).
  aiFlowchart: string;
};

export const EMPTY_ACTIVITY: Activity = {
  productId: "",
  customProductName: "",
  customLabel: "",
  stationCount: "",
  description: "",
  userJourney: "",
  communicationFlows: [],
  userDataCaptured: false,
  dataFields: "",
  dataSharedBack: "",
  clientProvidesData: false,
  dataFormat: "",
  dataNotes: "",
  fourBrainsDeliverables: [],
  clientDeliverables: [],
  deliverablesNote: "",
  specNotes: "",
  aiFlowchart: "",
};

// ---------- Brief (event-level + activities array) ----------
export type BriefFormData = {
  // Section 1 — Project & Client Info
  clientName: string;
  projectName: string;
  pocName: string;
  pocPhone: string;
  csbdOwner: string;
  pmName: string;
  briefReceivedOn: string;

  // Section 2 — Event Schedule & Venue
  // Dates are stored as ISO date strings (YYYY-MM-DD) from <input type="date">.
  // "To" fields are optional — empty means single-day.
  eventDateFrom: string;
  eventDateTo: string;
  cities: string;
  venueAddress: string;
  indoorOutdoor: string;
  setupDateFrom: string;
  setupDateTo: string;
  demoDateFrom: string;
  demoDateTo: string;

  // Section 3 — Activities (1 or more)
  activities: Activity[];

  // Section 4 — Design & Branding
  clientProvidesDesign: boolean;
  brandGuidelinesSharedYet: boolean;
  brandGuidelinesFollowUp: string;
  logoFilesReceived: boolean;
  brandColorsFonts: string;
  slotDayDesignVariations: boolean;
  slotDayDesignVariationsNotes: string;

  // Section 5 — Fabrication & On-site
  // Fabrication is split: client-side (what client builds / brings) and
  // 4Brains-side (what we fabricate). Either side can be active or both.
  fabricationByClient: boolean;
  fabricationClientNotes: string;
  fabricationByFourBrains: boolean;
  fabricationFourBrainsNotes: string;
  // One-line diagram (1LD) — schematic for power / signal flow / AV layout.
  oneLineDiagramRequired: boolean;
  oneLineDiagramNotes: string;
  internetByClient: boolean;
  internetClientDetails: string;
  internetFourBrainsArrangement: string;

  // Section 6 — Additional Notes (optional)
  additionalNotes: string;
};

export const EMPTY_BRIEF: BriefFormData = {
  clientName: "",
  projectName: "",
  pocName: "",
  pocPhone: "",
  csbdOwner: "",
  pmName: "",
  briefReceivedOn: "",

  eventDateFrom: "",
  eventDateTo: "",
  cities: "",
  venueAddress: "",
  indoorOutdoor: "",
  setupDateFrom: "",
  setupDateTo: "",
  demoDateFrom: "",
  demoDateTo: "",

  activities: [{ ...EMPTY_ACTIVITY }],

  clientProvidesDesign: false,
  brandGuidelinesSharedYet: false,
  brandGuidelinesFollowUp: "",
  logoFilesReceived: false,
  brandColorsFonts: "",
  slotDayDesignVariations: false,
  slotDayDesignVariationsNotes: "",

  fabricationByClient: false,
  fabricationClientNotes: "",
  fabricationByFourBrains: false,
  fabricationFourBrainsNotes: "",
  oneLineDiagramRequired: false,
  oneLineDiagramNotes: "",
  internetByClient: false,
  internetClientDetails: "",
  internetFourBrainsArrangement: "",

  additionalNotes: "",
};

const filled = (s: string | undefined | null) => Boolean(s && s.trim());

// ---------- Helpers ----------

export function activityProductName(a: Activity): string {
  if (a.productId === CUSTOM_PRODUCT_ID) return a.customProductName;
  const p = findProduct(a.productId);
  return p?.name ?? "";
}

export function activityDisplayName(a: Activity): string {
  if (filled(a.customLabel)) return a.customLabel.trim();
  return activityProductName(a);
}

export function activityCategory(a: Activity): string {
  if (a.productId === CUSTOM_PRODUCT_ID) return "Custom";
  return findProduct(a.productId)?.category ?? "";
}

// ---------- Completion checks ----------

export function isSection1Complete(v: BriefFormData): boolean {
  return (
    filled(v.clientName) &&
    filled(v.projectName) &&
    filled(v.pocName) &&
    filled(v.pocPhone) &&
    filled(v.csbdOwner) &&
    filled(v.pmName) &&
    filled(v.briefReceivedOn)
  );
}

export function isSection2Complete(v: BriefFormData): boolean {
  return (
    filled(v.eventDateFrom) &&
    filled(v.cities) &&
    filled(v.venueAddress) &&
    filled(v.indoorOutdoor) &&
    filled(v.setupDateFrom)
  );
}

// One activity is complete when:
//   - product picked (custom name filled if custom)
//   - station count + user journey filled
//   - data conditionals if userDataCaptured / clientProvidesData
// Description, deliverables, specNotes, communicationFlows are all optional.
export function isActivityComplete(a: Activity): boolean {
  if (!filled(a.productId)) return false;
  if (a.productId === CUSTOM_PRODUCT_ID && !filled(a.customProductName))
    return false;

  if (!filled(a.stationCount) || !filled(a.userJourney)) return false;

  if (a.userDataCaptured) {
    if (!filled(a.dataFields) || !filled(a.dataSharedBack)) return false;
  }
  if (a.clientProvidesData && !filled(a.dataFormat)) return false;

  return true;
}

export function isSection3Complete(v: BriefFormData): boolean {
  if (v.activities.length === 0) return false;
  return v.activities.every(isActivityComplete);
}

export function isSection4Complete(v: BriefFormData): boolean {
  if (v.clientProvidesDesign && !v.brandGuidelinesSharedYet) {
    if (!filled(v.brandGuidelinesFollowUp)) return false;
  }
  if (v.slotDayDesignVariations && !filled(v.slotDayDesignVariationsNotes))
    return false;
  return true;
}

export function isSection5Complete(v: BriefFormData): boolean {
  // 4Brains-side fabrication needs a description of what we're building.
  if (v.fabricationByFourBrains && !filled(v.fabricationFourBrainsNotes))
    return false;
  // Client-side fabrication notes are recommended but not strictly required.
  // 1LD notes also recommended; only flagged in getMissingRequiredFields.
  if (v.internetByClient) {
    if (!filled(v.internetClientDetails)) return false;
  } else {
    if (!filled(v.internetFourBrainsArrangement)) return false;
  }
  return true;
}

// Section 6 — Additional Notes (optional, always considered complete)
export function isSection6Complete(_v: BriefFormData): boolean {
  return true;
}

export const TOTAL_REQUIRED_SECTIONS = 5; // Section 6 is optional

export function completedSectionCount(v: BriefFormData): number {
  return [
    isSection1Complete(v),
    isSection2Complete(v),
    isSection3Complete(v),
    isSection4Complete(v),
    isSection5Complete(v),
  ].filter(Boolean).length;
}

// ---------- Per-field validation ----------

export type MissingField = {
  section: number;
  name: string;
  label: string;
  activityIndex?: number;
};

export function getMissingRequiredFields(v: BriefFormData): MissingField[] {
  const out: MissingField[] = [];

  if (!filled(v.clientName))
    out.push({ section: 1, name: "clientName", label: "Client / Brand Name" });
  if (!filled(v.projectName))
    out.push({
      section: 1,
      name: "projectName",
      label: "Project / Event Name",
    });
  if (!filled(v.pocName))
    out.push({ section: 1, name: "pocName", label: "POC Name" });
  if (!filled(v.pocPhone))
    out.push({ section: 1, name: "pocPhone", label: "POC Phone" });
  if (!filled(v.csbdOwner))
    out.push({
      section: 1,
      name: "csbdOwner",
      label: "CS/BD Owner from 4Brains",
    });
  if (!filled(v.pmName))
    out.push({ section: 1, name: "pmName", label: "PM Assigned" });
  if (!filled(v.briefReceivedOn))
    out.push({
      section: 1,
      name: "briefReceivedOn",
      label: "Brief Received On",
    });

  if (!filled(v.eventDateFrom))
    out.push({ section: 2, name: "eventDateFrom", label: "Event Date (From)" });
  if (!filled(v.cities))
    out.push({ section: 2, name: "cities", label: "City / Cities" });
  if (!filled(v.venueAddress))
    out.push({
      section: 2,
      name: "venueAddress",
      label: "Venue Name & Full Address",
    });
  if (!filled(v.indoorOutdoor))
    out.push({
      section: 2,
      name: "indoorOutdoor",
      label: "Indoor / Outdoor / Both",
    });
  if (!filled(v.setupDateFrom))
    out.push({
      section: 2,
      name: "setupDateFrom",
      label: "Setup Date (From)",
    });

  v.activities.forEach((a, idx) => {
    const path = (field: string) => `activities.${idx}.${field}`;
    if (!filled(a.productId))
      out.push({
        section: 3,
        name: path("productId"),
        label: "Activity",
        activityIndex: idx,
      });
    if (a.productId === CUSTOM_PRODUCT_ID && !filled(a.customProductName))
      out.push({
        section: 3,
        name: path("customProductName"),
        label: "Custom activity name",
        activityIndex: idx,
      });
    if (!filled(a.stationCount))
      out.push({
        section: 3,
        name: path("stationCount"),
        label: "Number of stations / units",
        activityIndex: idx,
      });
    if (!filled(a.userJourney))
      out.push({
        section: 3,
        name: path("userJourney"),
        label: "User Journey",
        activityIndex: idx,
      });
    if (a.userDataCaptured) {
      if (!filled(a.dataFields))
        out.push({
          section: 3,
          name: path("dataFields"),
          label: "Data Fields",
          activityIndex: idx,
        });
      if (!filled(a.dataSharedBack))
        out.push({
          section: 3,
          name: path("dataSharedBack"),
          label: "How shared back",
          activityIndex: idx,
        });
    }
    if (a.clientProvidesData && !filled(a.dataFormat))
      out.push({
        section: 3,
        name: path("dataFormat"),
        label: "Data Format",
        activityIndex: idx,
      });
  });

  if (v.clientProvidesDesign && !v.brandGuidelinesSharedYet) {
    if (!filled(v.brandGuidelinesFollowUp))
      out.push({
        section: 4,
        name: "brandGuidelinesFollowUp",
        label: "Flag for follow-up",
      });
  }
  if (v.slotDayDesignVariations && !filled(v.slotDayDesignVariationsNotes))
    out.push({
      section: 4,
      name: "slotDayDesignVariationsNotes",
      label: "Slot/Day Variations Notes",
    });

  if (v.fabricationByFourBrains && !filled(v.fabricationFourBrainsNotes))
    out.push({
      section: 5,
      name: "fabricationFourBrainsNotes",
      label: "What 4Brains will fabricate",
    });
  if (v.internetByClient) {
    if (!filled(v.internetClientDetails))
      out.push({
        section: 5,
        name: "internetClientDetails",
        label: "Internet Speed & Type",
      });
  } else {
    if (!filled(v.internetFourBrainsArrangement))
      out.push({
        section: 5,
        name: "internetFourBrainsArrangement",
        label: "4Brains Internet Arrangement",
      });
  }

  return out;
}

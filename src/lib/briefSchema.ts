// Brief form data shape, option lists, completion checks, mermaid helpers.

export const CATEGORIES = [
  "Registration",
  "Interactive",
  "Gamification",
  "AI Activations",
  "Digital Portraits",
  "Installations",
  "Projection Mapping",
  "New / Custom Activity",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const ACTIVITIES_BY_CATEGORY: Record<Category, string[]> = {
  Registration: [
    "Face Recognition",
    "AI Badge Printing",
    "QR Registration",
    "AR Invitation",
    "RFID Registration",
  ],
  Interactive: [
    "Interactive Tunnel",
    "Interactive Screen / Wall",
    "Interactive Floor",
    "Tangible Table",
    "Sliding Rotoscope",
    "Polarized Screen",
    "Control Room",
    "AR Table",
    "Holobox",
    "Interactive Telescope",
  ],
  Gamification: [
    "F1 Simulator",
    "Digital Graffiti",
    "Cycle Activity",
    "Quiz to Race",
    "Draw to Life",
    "VR Games",
    "Kinect Games",
    "Endless Runner",
    "Snake Game",
    "Bike Runner",
    "Quiz with Dispenser",
    "Tic Tac Toe",
    "AR Cricket",
    "Pac Man",
    "Arcade Boxing",
    "Hit It!",
    "Run to Fill",
    "Digital Batak",
    "Digital Diya",
    "Runpads",
  ],
  "AI Activations": [
    "AI Mixology",
    "Stable Diffusion",
    "AI Humanoid",
    "AI Art",
    "AI Photobooth",
    "AI Videobooth",
    "AI Chatbot",
  ],
  "Digital Portraits": [
    "Digital Caricature",
    "Picaso Art",
    "Pop-Up Figure",
    "Tote Bags",
    "Word Cloud Booth",
    "Magazine Booth",
    "AR Photobooth",
  ],
  Installations: ["Verve Tiles", "Nexus Pillars", "Spectra"],
  "Projection Mapping": ["Projection Mapping"],
  "New / Custom Activity": [],
};

export const RECEIVED_VIA_OPTIONS = [
  "Call",
  "Email",
  "Meeting",
  "WhatsApp",
] as const;

export const INDOOR_OUTDOOR_OPTIONS = ["Indoor", "Outdoor", "Both"] as const;

export const OUTPUT_DEVICES = [
  "iPad",
  "Android Tablet",
  "Laptop",
  "TV Screen",
  "LED Screen",
  "Projector",
  "Mobile Phone",
  "Print Only",
  "No display",
] as const;

export const TV_SIZES = ['32"', '43"', '55"', '65"', "Custom"] as const;

export const PRINT_SIZES = [
  "A4",
  "4x6 inch",
  "6x4 inch",
  "Custom",
] as const;

export const ORIENTATIONS = ["Portrait", "Landscape"] as const;

export const OUTPUT_FORMATS = [
  "Photo",
  "Video",
  "GIF",
  "Print",
  "Digital Share",
  "Physical Product",
  "Data Only",
  "Other",
] as const;

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

export type BriefFormData = {
  // Section 1
  clientName: string;
  projectName: string;
  pocName: string;
  pocDesignation: string;
  pocPhone: string;
  pocEmail: string;
  csbdOwner: string;
  pmId: string;
  briefReceivedOn: string;
  briefReceivedVia: string;

  // Section 2
  eventDates: string;
  cities: string;
  venueAddress: string;
  indoorOutdoor: string;
  eventTimes: string;
  setupDateTime: string;
  setupDuration: string;
  dismantleDateTime: string;
  demoRequired: boolean;
  demoDateTime: string;
  venueAccessNotes: string;

  // Section 3
  category: string;
  activityType: string;
  activityCustomName: string;
  activityName: string;
  activityCount: string;
  activityDescription: string;
  outputDevices: string[];
  tvSize: string;
  ledPixelPitch: string;
  ledDimensions: string;
  printRequired: boolean;
  printSize: string;
  printTotal: string;
  printOrientation: string;
  printPreTemplates: boolean;
  outputFormats: string[];
  communicationFlows: string[];
  referenceAttachments: string[];

  // Section 4
  userJourney: string;
  customFlowchart: string;

  // Section 5 — Client Requirements
  clientWants: string;
  mustHaves: string;
  thingsClientSaidNo: string;
  referenceLinks: string;
  referenceMoodFiles: string[];

  // Section 6 — Design & Branding
  brandGuidelinesShared: boolean;
  brandGuidelinesFile: string;
  brandGuidelinesFollowUp: string;
  logoFilesReceived: boolean;
  logoFiles: string[];
  brandColorsFonts: string;
  slotDayDesignVariations: boolean;
  slotDayDesignVariationsNotes: string;

  // Section 7 — Data & Personalization
  userDataCaptured: boolean;
  dataFields: string;
  dataSharedBack: string;
  clientProvidesData: boolean;
  dataFormat: string;
  dataSampleFile: string;
  dataNotes: string;

  // Section 8 — Fabrication & On-site
  fabricationRequired: boolean;
  fabricationNotes: string;
  lineDiagramRequired: boolean;
  internetByClient: boolean;
  internetClientDetails: string;
  internetFourBrainsArrangement: string;

  // Section 9 — Deliverables
  clientWillProvide: string;
  fourBrainsWillProvide: string;

  // Section 10 — Timeline
  timelineDemoDate: string;
  timelineSetupDate: string;
  timelineFinalDeadline: string;

  // Section 11 — Additional Notes
  additionalNotes: string;
};

export const EMPTY_BRIEF: BriefFormData = {
  clientName: "",
  projectName: "",
  pocName: "",
  pocDesignation: "",
  pocPhone: "",
  pocEmail: "",
  csbdOwner: "",
  pmId: "",
  briefReceivedOn: "",
  briefReceivedVia: "",

  eventDates: "",
  cities: "",
  venueAddress: "",
  indoorOutdoor: "",
  eventTimes: "",
  setupDateTime: "",
  setupDuration: "",
  dismantleDateTime: "",
  demoRequired: false,
  demoDateTime: "",
  venueAccessNotes: "",

  category: "",
  activityType: "",
  activityCustomName: "",
  activityName: "",
  activityCount: "",
  activityDescription: "",
  outputDevices: [],
  tvSize: "",
  ledPixelPitch: "",
  ledDimensions: "",
  printRequired: false,
  printSize: "",
  printTotal: "",
  printOrientation: "",
  printPreTemplates: false,
  outputFormats: [],
  communicationFlows: [],
  referenceAttachments: [],

  userJourney: "",
  customFlowchart: "",

  clientWants: "",
  mustHaves: "",
  thingsClientSaidNo: "",
  referenceLinks: "",
  referenceMoodFiles: [],

  brandGuidelinesShared: false,
  brandGuidelinesFile: "",
  brandGuidelinesFollowUp: "",
  logoFilesReceived: false,
  logoFiles: [],
  brandColorsFonts: "",
  slotDayDesignVariations: false,
  slotDayDesignVariationsNotes: "",

  userDataCaptured: false,
  dataFields: "",
  dataSharedBack: "",
  clientProvidesData: false,
  dataFormat: "",
  dataSampleFile: "",
  dataNotes: "",

  fabricationRequired: false,
  fabricationNotes: "",
  lineDiagramRequired: false,
  internetByClient: false,
  internetClientDetails: "",
  internetFourBrainsArrangement: "",

  clientWillProvide: "",
  fourBrainsWillProvide: "",

  timelineDemoDate: "",
  timelineSetupDate: "",
  timelineFinalDeadline: "",

  additionalNotes: "",
};

const filled = (s: string | undefined | null) => Boolean(s && s.trim());

export function isSection1Complete(v: BriefFormData): boolean {
  return (
    filled(v.clientName) &&
    filled(v.projectName) &&
    filled(v.pocName) &&
    filled(v.pocDesignation) &&
    filled(v.pocPhone) &&
    filled(v.pocEmail) &&
    filled(v.csbdOwner) &&
    filled(v.pmId) &&
    filled(v.briefReceivedOn)
  );
}

export function isSection2Complete(v: BriefFormData): boolean {
  if (
    !filled(v.eventDates) ||
    !filled(v.cities) ||
    !filled(v.venueAddress) ||
    !filled(v.indoorOutdoor) ||
    !filled(v.eventTimes) ||
    !filled(v.setupDateTime) ||
    !filled(v.setupDuration) ||
    !filled(v.dismantleDateTime)
  )
    return false;
  if (v.demoRequired && !filled(v.demoDateTime)) return false;
  return true;
}

export function isSection3Complete(v: BriefFormData): boolean {
  if (!filled(v.category)) return false;

  // Activity selection
  if (v.category === "New / Custom Activity") {
    if (!filled(v.activityCustomName)) return false;
  } else {
    if (!filled(v.activityType)) return false;
  }

  if (
    !filled(v.activityName) ||
    !filled(v.activityCount) ||
    !filled(v.activityDescription)
  )
    return false;

  if (v.outputDevices.length === 0) return false;
  if (v.outputDevices.includes("TV Screen") && !filled(v.tvSize)) return false;
  if (
    v.outputDevices.includes("LED Screen") &&
    (!filled(v.ledPixelPitch) || !filled(v.ledDimensions))
  )
    return false;

  if (v.printRequired) {
    if (
      !filled(v.printSize) ||
      !filled(v.printTotal) ||
      !filled(v.printOrientation)
    )
      return false;
  }

  if (v.outputFormats.length === 0) return false;

  if (v.category === "Registration" && v.communicationFlows.length === 0)
    return false;

  return true;
}

export function isSection4Complete(v: BriefFormData): boolean {
  return filled(v.userJourney);
}

export function isSection5Complete(v: BriefFormData): boolean {
  return filled(v.clientWants) && filled(v.mustHaves);
}

export function isSection6Complete(v: BriefFormData): boolean {
  // Y/N booleans default to false (= "No"), which is a valid answer.
  // Conditionals: if Yes was chosen, the conditional fields must be filled.
  if (v.brandGuidelinesShared) {
    if (!filled(v.brandGuidelinesFile)) return false;
  } else {
    // No → flag follow-up note required
    if (!filled(v.brandGuidelinesFollowUp)) return false;
  }
  if (v.logoFilesReceived && v.logoFiles.length === 0) return false;
  if (v.slotDayDesignVariations && !filled(v.slotDayDesignVariationsNotes))
    return false;
  return true;
}

export function isSection7Complete(v: BriefFormData): boolean {
  if (v.userDataCaptured) {
    if (!filled(v.dataFields) || !filled(v.dataSharedBack)) return false;
  }
  if (v.clientProvidesData) {
    if (!filled(v.dataFormat)) return false;
  }
  return true;
}

export function isSection8Complete(v: BriefFormData): boolean {
  if (v.fabricationRequired && !filled(v.fabricationNotes)) return false;
  if (v.internetByClient) {
    if (!filled(v.internetClientDetails)) return false;
  } else {
    if (!filled(v.internetFourBrainsArrangement)) return false;
  }
  return true;
}

export function isSection9Complete(v: BriefFormData): boolean {
  return filled(v.clientWillProvide) && filled(v.fourBrainsWillProvide);
}

export function isSection10Complete(v: BriefFormData): boolean {
  return (
    filled(v.timelineDemoDate) &&
    filled(v.timelineSetupDate) &&
    filled(v.timelineFinalDeadline)
  );
}

export function isSection11Complete(_v: BriefFormData): boolean {
  // Optional section — always considered complete.
  return true;
}

export const TOTAL_REQUIRED_SECTIONS = 10; // Section 11 is optional

export function completedSectionCount(v: BriefFormData): number {
  // Counts the 10 required sections; section 11 is optional and not tallied.
  return [
    isSection1Complete(v),
    isSection2Complete(v),
    isSection3Complete(v),
    isSection4Complete(v),
    isSection5Complete(v),
    isSection6Complete(v),
    isSection7Complete(v),
    isSection8Complete(v),
    isSection9Complete(v),
    isSection10Complete(v),
  ].filter(Boolean).length;
}

// ---------- Per-field validation for Send-to-PM / Export ----------

export type MissingField = {
  section: number;
  name: keyof BriefFormData;
  label: string;
};

export function getMissingRequiredFields(v: BriefFormData): MissingField[] {
  const out: MissingField[] = [];
  const need = (
    section: number,
    name: keyof BriefFormData,
    label: string,
    cond = true,
  ) => {
    if (!cond) return;
    const value = v[name];
    const empty = Array.isArray(value)
      ? value.length === 0
      : typeof value === "string"
        ? !filled(value)
        : false; // booleans are never "missing"
    if (empty) out.push({ section, name, label });
  };

  // Section 1
  need(1, "clientName", "Client / Brand Name");
  need(1, "projectName", "Project / Event Name");
  need(1, "pocName", "POC Name");
  need(1, "pocDesignation", "POC Designation");
  need(1, "pocPhone", "POC Phone");
  need(1, "pocEmail", "POC Email");
  need(1, "csbdOwner", "CS/BD Owner from 4Brains");
  need(1, "pmId", "PM Assigned");
  need(1, "briefReceivedOn", "Brief Received On");

  // Section 2
  need(2, "eventDates", "Event Date(s)");
  need(2, "cities", "City / Cities");
  need(2, "venueAddress", "Venue Name & Full Address");
  need(2, "indoorOutdoor", "Indoor / Outdoor / Both");
  need(2, "eventTimes", "Event Start & End Time per slot");
  need(2, "setupDateTime", "Setup Date & Time");
  need(2, "setupDuration", "Setup Duration Available");
  need(2, "dismantleDateTime", "Dismantle Date & Time");
  need(2, "demoDateTime", "Demo Date & Time", v.demoRequired);

  // Section 3
  need(3, "category", "Category");
  if (v.category === "New / Custom Activity") {
    need(3, "activityCustomName", "Custom Activity Name");
  } else if (v.category) {
    need(3, "activityType", "Activity");
  }
  need(3, "activityName", "Activity Name");
  need(3, "activityCount", "Number of Activities / Installations");
  need(3, "activityDescription", "Activity Description");
  need(3, "outputDevices", "Output / Display Device");
  need(3, "tvSize", "TV Size", v.outputDevices.includes("TV Screen"));
  need(
    3,
    "ledPixelPitch",
    "LED Pixel Pitch",
    v.outputDevices.includes("LED Screen"),
  );
  need(
    3,
    "ledDimensions",
    "LED Dimensions",
    v.outputDevices.includes("LED Screen"),
  );
  need(3, "printSize", "Print Size", v.printRequired);
  need(3, "printTotal", "Total Prints", v.printRequired);
  need(3, "printOrientation", "Orientation", v.printRequired);
  need(3, "outputFormats", "Output Format");
  need(
    3,
    "communicationFlows",
    "Communication / Invite Flow",
    v.category === "Registration",
  );

  // Section 4
  need(4, "userJourney", "User Journey");

  // Section 5
  need(5, "clientWants", "What does the client want?");
  need(5, "mustHaves", "Must-have features / non-negotiables");

  // Section 6
  if (v.brandGuidelinesShared) {
    need(6, "brandGuidelinesFile", "Brand Guidelines File");
  } else {
    need(6, "brandGuidelinesFollowUp", "Flag for follow-up");
  }
  need(6, "logoFiles", "Logo Files", v.logoFilesReceived);
  need(
    6,
    "slotDayDesignVariationsNotes",
    "Slot/Day Variations Notes",
    v.slotDayDesignVariations,
  );

  // Section 7
  need(7, "dataFields", "Data Fields", v.userDataCaptured);
  need(7, "dataSharedBack", "How shared back", v.userDataCaptured);
  need(7, "dataFormat", "Data Format", v.clientProvidesData);

  // Section 8
  need(8, "fabricationNotes", "Fabrication Notes", v.fabricationRequired);
  if (v.internetByClient) {
    need(8, "internetClientDetails", "Internet Speed & Type");
  } else {
    need(8, "internetFourBrainsArrangement", "4Brains Internet Arrangement");
  }

  // Section 9
  need(9, "clientWillProvide", "What Client Will Provide");
  need(9, "fourBrainsWillProvide", "What 4Brains Will Provide");

  // Section 10
  need(10, "timelineDemoDate", "Demo Date");
  need(10, "timelineSetupDate", "Setup Date");
  need(10, "timelineFinalDeadline", "Final Deadline");

  // Section 11 has no required fields.

  return out;
}

// ---------- Mermaid helpers ----------

export function parseJourneySteps(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(
        /^(?:step\s*\d+\s*[:.\-]?\s*|\d+\s*[.)]\s*|[-*•]\s*)(.+)$/i,
      );
      return (m ? m[1] : line).trim();
    })
    .filter(Boolean);
}

function escapeMermaidLabel(s: string): string {
  // Mermaid breaks on quotes, brackets, backticks. Strip them and clamp length.
  return s.replace(/["`\[\]]/g, "").slice(0, 80);
}

export function stepsToMermaid(steps: string[]): string {
  if (steps.length === 0) return "";
  const lines: string[] = ["graph TD"];
  steps.forEach((s, i) => {
    lines.push(`  N${i}["${escapeMermaidLabel(s)}"]`);
  });
  for (let i = 0; i < steps.length - 1; i++) {
    lines.push(`  N${i} --> N${i + 1}`);
  }
  return lines.join("\n");
}

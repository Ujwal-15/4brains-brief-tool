// Wipe all existing briefs and seed three reference briefs:
//   - Brief 1: 1 activity (small client showcase)
//   - Brief 2: 3 activities (mid-size brand activation)
//   - Brief 3: 6 activities (multi-zone flagship)
//
// Each activity gets a hand-crafted Mermaid `aiFlowchart` so that when CS
// opens the brief and clicks Export PDF + Flowchart, browser-side Mermaid
// renders the chart to PNG and ships it to the server alongside the PDF.
//
// Run with:
//   unset ANTHROPIC_API_KEY && npx tsx scripts/seed-briefs.ts
//
// Requires SUPABASE_URL + SUPABASE_SECRET_KEY (service role) in .env so the
// script can bypass RLS for inserts.

import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

// --- Load .env manually so we don't need a dotenv dep ---
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Activity / Brief shapes (mirror src/lib/briefSchema.ts) ---
type Activity = {
  productId: string;
  customProductName: string;
  customLabel: string;
  stationCount: string;
  description: string;
  userJourney: string;
  communicationFlows: string[];
  userDataCaptured: boolean;
  dataFields: string;
  dataSharedBack: string;
  clientProvidesData: boolean;
  dataFormat: string;
  dataNotes: string;
  fourBrainsDeliverables: string[];
  clientDeliverables: string[];
  deliverablesNote: string;
  specNotes: string;
  aiFlowchart: string;
};

const EMPTY_ACTIVITY: Activity = {
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

function activity(over: Partial<Activity>): Activity {
  return { ...EMPTY_ACTIVITY, ...over };
}

// --- Realistic Mermaid flowcharts (4–7 nodes each).
// Labels are quoted to keep ?, /, parentheses safe under Mermaid's strict
// security level. No custom classDef — keeps render fast and reliable.

const FC_QR_REG = `graph TD
A["Visitor scans QR"]
B["System validates badge"]
C{"Recognised?"}
D["Auto-fill name and room"]
E["Manual entry at counter"]
F["Personalised badge prints"]
G["Hostess hands over badge"]
A --> B
B --> C
C -- Yes --> D
C -- No --> E
D --> F
E --> F
F --> G`;

const FC_AI_CARICATURE = `graph TD
A["Visitor steps to camera"]
B["3-2-1 capture countdown"]
C["AI generates caricature"]
D["User picks 1 of 3 styles"]
E["Postcard prints"]
F["Visitor walks away"]
A --> B --> C --> D --> E --> F`;

const FC_SPIN_WHEEL = `graph TD
A["Scan QR launches microsite"]
B["Enter name and phone"]
C["Spin the wheel"]
D{"Result tier"}
E["Sample pack"]
F["Branded merch"]
G["Grand prize entry"]
H["Live dashboard logs"]
A --> B --> C --> D
D -- Tier 1 --> E
D -- Tier 2 --> F
D -- Tier 3 --> G
E --> H
F --> H
G --> H`;

const FC_AI_VIDEOBOOTH = `graph TD
A["Visitor enters booth"]
B["Records 5s clip"]
C["AI restyles in real-time"]
D["Preview shown on screen"]
E{"Approve?"}
F["Share via WhatsApp or email"]
G["Re-shoot"]
A --> B --> C --> D --> E
E -- Yes --> F
E -- No --> G --> B`;

const FC_PHOTOBOOTH = `graph TD
A["Pose at booth"]
B["Capture 4 frames"]
C["Branded strip prints"]
D["Email or WhatsApp digital copy"]
A --> B --> C --> D`;

const FC_LEADERBOARD = `graph TD
A["Visitor scans QR badge"]
B["Linked to existing profile"]
C["Earns points across activities"]
D["Live leaderboard updates"]
E["Top 10 displayed at hub"]
F["Winner announcement"]
A --> B --> C --> D --> E --> F`;

const FC_AR_TABLE = `graph TD
A["Visitor picks AR object"]
B["Places marker on table"]
C["3D content overlays"]
D["Tap for product details"]
E["CTA: Book a demo"]
A --> B --> C --> D --> E`;

const FC_RFID_CUBE = `graph TD
A["Pick up RFID cube"]
B["Place on smart pedestal"]
C["Screen shows linked content"]
D{"Scroll cubes?"}
E["Switch story"]
F["Watch full story"]
A --> B --> C --> D
D -- Yes --> E --> C
D -- No --> F`;

// ----------------- Brief content -----------------

const BRIEF_1 = {
  // Section 1
  clientName: "Lumora Cosmetics",
  projectName: "Lumora Glow Pop-up · Bengaluru",
  pocName: "Aditi Rao",
  pocPhone: "+91 98 8765 4321",
  csbdOwner: "Priya Sharma",
  pmName: "Rohan Iyer",
  briefReceivedOn: "2026-04-22",

  // Section 2
  eventDateFrom: "2026-05-18",
  eventDateTo: "",
  cities: "Bengaluru",
  venueAddress:
    "Phoenix Marketcity, Whitefield Main Road, Mahadevpura, Bengaluru 560048. Activation in central atrium, ground floor.",
  indoorOutdoor: "Indoor",
  setupDateFrom: "2026-05-17",
  setupDateTo: "",
  demoDateFrom: "",
  demoDateTo: "",

  // Section 3
  activities: [
    activity({
      productId: "ai-registration-caricature",
      stationCount: "1",
      description:
        "Single AI Caricature registration desk at the mall atrium entrance. Ladies SKU launch — visitors grab a stylised caricature postcard featuring the new lipstick shade as a take-home keepsake.",
      userJourney:
        "1. Visitor walks up to the desk\n2. Hostess scans QR / enters phone\n3. Camera takes a quick selfie\n4. AI generates caricature with Lumora frame\n5. Postcard prints in <12s\n6. Visitor signs up for newsletter on tablet",
      aiFlowchart: FC_AI_CARICATURE,
      communicationFlows: ["WhatsApp + QR", "Email + QR"],
      userDataCaptured: true,
      dataFields: "Name, Phone, Email, Selfie consent, Newsletter opt-in",
      dataSharedBack: "CSV via email day-after, plus live attendee count to PM dashboard",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "DSLR + softbox lighting",
        "MacBook Pro with caricature model",
        "Canon Selphy postcard printer",
        "iPad with newsletter sign-up form",
        "Trained operator (1)",
      ],
      clientDeliverables: [
        "Lumora postcard frame design",
        "Newsletter copy",
        "Power point + Wi-Fi access at venue",
      ],
      deliverablesNote:
        "Backup printer ribbons (3x) on-site. Postcard template approval needed by May 12.",
      specNotes:
        "Postcard size 4x6 in landscape. Lumora Pink Pantone match must be verified pre-event with sample print on May 14.",
    }),
  ],

  // Section 4
  clientProvidesDesign: true,
  brandGuidelinesSharedYet: true,
  brandGuidelinesFollowUp: "",
  logoFilesReceived: true,
  brandColorsFonts: "Lumora Pink #E6457A, Cream #FFF7EE / Inter, Cormorant Garamond display",
  slotDayDesignVariations: false,
  slotDayDesignVariationsNotes: "",

  // Section 5
  fabricationByClient: false,
  fabricationClientNotes: "",
  fabricationByFourBrains: true,
  fabricationFourBrainsNotes:
    "6ft branded counter wrap with Lumora Pink flex finish, foam-core 'NEW SHADE' arch above the activation. Vendor: Praveen Acrylics, refs in deck.",
  oneLineDiagramRequired: false,
  oneLineDiagramNotes: "",
  internetByClient: true,
  internetClientDetails:
    "Phoenix mall guest Wi-Fi (50 Mbps); 4Brains will keep a 5G hotspot as backup.",
  internetFourBrainsArrangement: "",

  // Section 6
  additionalNotes:
    "Soft launch with brand team between 11am–1pm on Day 1. Footfall expected 300/day. Operator must be fluent in Kannada + English.",
};

const BRIEF_2 = {
  clientName: "Acme Beverages",
  projectName: "Acme Spring Activation · Mumbai",
  pocName: "Anika Verma",
  pocPhone: "+91 98 7654 3210",
  csbdOwner: "Priya Sharma",
  pmName: "Rohan Iyer",
  briefReceivedOn: "2026-04-15",

  eventDateFrom: "2026-05-22",
  eventDateTo: "2026-05-24",
  cities: "Mumbai",
  venueAddress:
    "Jio World Drive, BKC, Mumbai 400051. Outdoor activation zone adjacent to the main entrance plaza.",
  indoorOutdoor: "Outdoor",
  setupDateFrom: "2026-05-21",
  setupDateTo: "",
  demoDateFrom: "2026-05-20",
  demoDateTo: "",

  activities: [
    activity({
      productId: "qr-registration",
      stationCount: "2",
      description:
        "Twin QR registration desks flanking the activation zone entrance. Pre-event invites carry a unique QR; on-site scan auto-creates a badge and assigns the visitor to one of three brand experience tracks.",
      userJourney:
        "1. Visitor scans QR from invite\n2. System validates code\n3. Auto-fill name + experience track\n4. Personalised badge prints in <8s\n5. Hostess hands over badge\n6. Visitor enters track-specific zone",
      aiFlowchart: FC_QR_REG,
      communicationFlows: ["Email + QR", "WhatsApp + QR"],
      userDataCaptured: true,
      dataFields: "Name, Company, Designation, Phone, Track assignment",
      dataSharedBack: "Live PM dashboard during event + post-event CSV via email",
      clientProvidesData: true,
      dataFormat: "Excel",
      dataNotes:
        "Pre-event guest list (~1,200) shared by client May 14. Three sheets: Bloggers, Trade, Internal.",
      fourBrainsDeliverables: [
        "iPad x 2 with registration software",
        "Brother dye-sub printer x 2",
        "Power + cable management",
        "On-ground operator (2)",
      ],
      clientDeliverables: [
        "Pre-event guest list (Excel, 3 sheets)",
        "Branded counter graphics flex",
        "Storage table + power",
      ],
      deliverablesNote: "Print 50 walk-in spare badges per day for unregistered guests.",
      specNotes:
        "Badge size 4x3 inches landscape, dye-sub print, lanyard slot punched. Acme blue Pantone 2935 C must match.",
    }),
    activity({
      productId: "ai-videobooth",
      stationCount: "1",
      description:
        "5-second AI restyle video booth — visitor records themselves holding the new spring SKU and the AI applies an Acme brand-aesthetic visual filter (animated splash + tagline overlay). Shareable instantly.",
      userJourney:
        "1. Visitor steps into booth\n2. Records 5s clip on prompt\n3. AI restyles with brand visual\n4. Preview on screen\n5. Approve or re-shoot\n6. Share via WhatsApp / Instagram DM",
      aiFlowchart: FC_AI_VIDEOBOOTH,
      communicationFlows: [],
      userDataCaptured: true,
      dataFields: "Phone (for share), Approval consent, Video URL",
      dataSharedBack: "Live count + daily share-rate report",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "AI video booth setup",
        "MacBook Pro with restyle model",
        "DSLR + LED ring light",
        "Operator (1)",
      ],
      clientDeliverables: ["Brand visual reference", "Tagline copy"],
      deliverablesNote: "Backup laptop on standby with cached model.",
      specNotes:
        "Output 1080x1920 9:16 vertical for social. Brand splash duration 0.8s at start, 1.2s at end.",
    }),
    activity({
      productId: "spin-wheel",
      customProductName: "Spin-the-Wheel Microsite",
      stationCount: "1",
      description:
        "QR-launched microsite with branded wheel offering three prize tiers — sample pack, branded merch, grand prize entry. Visitors must complete a 2-question survey to spin.",
      userJourney:
        "1. Scan QR launches microsite\n2. Enter name + phone\n3. Answer 2 brand questions\n4. Spin the wheel\n5. Result reveal + tier-specific instructions\n6. Live dashboard logs",
      aiFlowchart: FC_SPIN_WHEEL,
      communicationFlows: ["Microsite", "WhatsApp + QR"],
      userDataCaptured: true,
      dataFields: "Name, Phone, Survey responses, Spin result, Timestamp",
      dataSharedBack: "Live dashboard during event + post-event CSV",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "Spin-wheel microsite (custom build)",
        "Hosting on 4Brains infra",
        "QR signage at activation",
      ],
      clientDeliverables: [
        "Survey questions (final by May 12)",
        "Prize inventory + redemption process",
      ],
      deliverablesNote: "Microsite analytics URL shared with client BD lead.",
      specNotes: "Mobile-first responsive. Wheel animation 3.2s, easing back-out.",
    }),
  ],

  clientProvidesDesign: true,
  brandGuidelinesSharedYet: true,
  brandGuidelinesFollowUp: "",
  logoFilesReceived: true,
  brandColorsFonts:
    "Acme Blue #0E5DA8, Sun Yellow #F2C94C, Cream #FAF7EE / Inter, DM Serif Display",
  slotDayDesignVariations: true,
  slotDayDesignVariationsNotes:
    "Day 1 = Bloggers (yellow accent), Day 2 = Trade (blue accent), Day 3 = Public (full palette).",

  fabricationByClient: true,
  fabricationClientNotes:
    "Acme will ship the 8ft x 6ft photobooth backdrop frame from their Mumbai warehouse, plus branded counter graphics flex prints for the registration desks.",
  fabricationByFourBrains: true,
  fabricationFourBrainsNotes:
    "Custom acrylic enclosures (2 reg desks, 1 video booth), branded vinyl wraps, internal cable channels. Vendor: Praveen Acrylics, refs in deck. Power distribution by 4Brains AV.",
  oneLineDiagramRequired: true,
  oneLineDiagramNotes:
    "Power + signal flow diagram needed for venue submission. 4Brains AV team to share by May 12. Includes generator backup loop.",
  internetByClient: false,
  internetClientDetails: "",
  internetFourBrainsArrangement:
    "Jio Postpaid 5G hotspot dedicated to activation zone, backup Airtel 5G dongle on standby. Speedtest log captured every 30min.",

  additionalNotes:
    "Soft launch on Day 1 between 4–7pm with C-suite walkthrough. Footfall expected ~600/day on Sat-Sun. Backup printer ribbons + LED light bulbs on-site. Day 3 closes early at 7pm.",
};

const BRIEF_3 = {
  clientName: "Northstar Auto",
  projectName: "Northstar EV Reveal · Delhi · Auto Expo Wing",
  pocName: "Vikram Singh",
  pocPhone: "+91 99 1234 5678",
  csbdOwner: "Priya Sharma",
  pmName: "Rohan Iyer",
  briefReceivedOn: "2026-04-08",

  eventDateFrom: "2026-06-04",
  eventDateTo: "2026-06-08",
  cities: "Delhi NCR",
  venueAddress:
    "Hall 7, Pragati Maidan, New Delhi 110001. Northstar pavilion occupies 2,400 sqft including a sealed reveal stage and four interactive zones.",
  indoorOutdoor: "Indoor",
  setupDateFrom: "2026-06-01",
  setupDateTo: "2026-06-03",
  demoDateFrom: "2026-05-28",
  demoDateTo: "",

  activities: [
    activity({
      productId: "face-registration",
      stationCount: "3",
      description:
        "Three face-recognition kiosks at the pavilion entrance. Press, dealers, and public have separate queues; face-rec auto-assigns badge tier based on pre-registered profile.",
      userJourney:
        "1. Visitor approaches assigned queue\n2. Kiosk camera captures face\n3. Match to pre-registered profile\n4. Auto-issue tier badge (Press / Dealer / Public)\n5. Personalised tour map prints with QR\n6. Hostess directs to first zone",
      aiFlowchart: FC_QR_REG,
      communicationFlows: ["Email + Attachment", "WhatsApp + QR"],
      userDataCaptured: true,
      dataFields: "Name, Company, Tier, Face vector hash, Tour-map QR",
      dataSharedBack: "Live PM dashboard with tier breakdown + post-event CSV",
      clientProvidesData: true,
      dataFormat: "Excel",
      dataNotes: "Pre-registered list (~3,500): Press 400, Dealers 1,200, Public 1,900.",
      fourBrainsDeliverables: [
        "Face-rec kiosks x 3",
        "MacBook Pros x 3",
        "Brother dye-sub printers x 3",
        "Tier-tracking dashboard",
        "Operators x 3",
      ],
      clientDeliverables: [
        "Pre-registered guest list (3 tiers, Excel)",
        "Tour-map design (3 variants by tier)",
        "Power + dedicated SSID at queue area",
      ],
      deliverablesNote:
        "Privacy notice signage at each kiosk per DPDP Act. Face vectors hashed, not stored as raw images.",
      specNotes:
        "Kiosks at standing height (135cm), 24in capacitive touch. Print 2x match-fail walk-in spares per hour. ISO 27001 compliance audit by client legal.",
    }),
    activity({
      productId: "ai-twin",
      stationCount: "1",
      description:
        "AI Twin booth — visitor's photo is restyled into a 'driver of the future' avatar inside the new EV. Shareable still + 3s loop. Lives in the reveal zone, post-keynote.",
      userJourney:
        "1. Post-reveal queue forms\n2. Visitor steps to capture point\n3. Selfie + 3 prompt questions\n4. AI generates 'EV driver' avatar in 14s\n5. User picks 1 of 3 background variants\n6. Email/WhatsApp share + display on social wall",
      aiFlowchart: FC_AI_VIDEOBOOTH,
      communicationFlows: ["Email + Attachment", "WhatsApp + Attachment"],
      userDataCaptured: true,
      dataFields: "Name, Email, Phone, Avatar consent, Output URL",
      dataSharedBack: "Live count, social-wall feed, daily MMS share-rate report",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "AI Twin compute box (RTX 4090)",
        "Capture rig + LED",
        "55-inch preview screen",
        "Operators x 2 (queue + capture)",
      ],
      clientDeliverables: ["Background variants (3)", "Approved consent copy", "Tagline"],
      deliverablesNote: "Backup avatar model deployed on cloud failover.",
      specNotes:
        "Output 2160x2700 high-res for social. Generation pipeline target <14s, fallback 22s with cached prompts.",
    }),
    activity({
      productId: "ar-table",
      stationCount: "2",
      description:
        "Two AR Tables in the technical-spec zone. Visitors place a marker on the table and a 3D model of the EV's drivetrain / battery / chassis renders. Tap-through reveals component cutaways.",
      userJourney:
        "1. Visitor picks marker (3 systems available)\n2. Place on table surface\n3. 3D drivetrain renders\n4. Tap component for cutaway view\n5. CTA: Book a test drive\n6. CTA confirms via WhatsApp",
      aiFlowchart: FC_AR_TABLE,
      communicationFlows: ["WhatsApp"],
      userDataCaptured: true,
      dataFields: "Name, Phone, Test-drive city + slot preference",
      dataSharedBack: "Daily test-drive lead CSV to client CRM team",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "AR Tables x 2 (custom enclosure)",
        "AR markers (3 per table)",
        "iPad-driven content engine",
        "Operator (1, floats between tables)",
      ],
      clientDeliverables: [
        "3D model files (drivetrain, battery, chassis)",
        "Component cutaway descriptions",
        "Test-drive booking webhook URL",
      ],
      deliverablesNote: "Marker design approval by May 26 — 3 markers per table, magnetic.",
      specNotes:
        "Table surface 32-inch capacitive, 4K render at 60fps. Models capped at 1.2M tris.",
    }),
    activity({
      productId: "rfid-cube",
      stationCount: "4",
      description:
        "Four RFID Cube pedestals in the heritage zone — visitors pick up cubes representing key brand milestones (1962 founding, 2008 hybrid, 2024 EV launch, 2026 reveal model). Placing on the smart pedestal triggers a 90s film on the pedestal's screen.",
      userJourney:
        "1. Visitor picks up cube\n2. Places on smart pedestal\n3. Pedestal screen shows linked story film\n4. Switch cubes mid-story?\n5. If yes — switch story\n6. If no — watch full 90s",
      aiFlowchart: FC_RFID_CUBE,
      communicationFlows: [],
      userDataCaptured: false,
      dataFields: "",
      dataSharedBack: "",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "RFID pedestals x 4 (custom)",
        "Cubes x 16 (4 designs, 4 spares)",
        "27-inch screens x 4",
        "Content engine (4 films)",
      ],
      clientDeliverables: [
        "Story films (4 x 90s, mp4 ProRes)",
        "Cube design references (heritage palette)",
      ],
      deliverablesNote:
        "Films must include subtitles (English + Hindi) per accessibility brief.",
      specNotes:
        "Pedestal at 95cm height. Screens 27-inch matte. RFID reader range tuned to 5cm to avoid cross-trigger.",
    }),
    activity({
      productId: "photobooth",
      customProductName: "Premium Photobooth",
      stationCount: "1",
      description:
        "Premium photobooth in the social zone — branded backdrop with the new EV silhouette. 4-frame strip with EV outline animation across frames. Print + digital share.",
      userJourney:
        "1. Pose at branded backdrop\n2. 4-frame countdown capture\n3. AI overlays EV silhouette across frames\n4. Branded strip prints (2 copies)\n5. Email/WhatsApp digital copy",
      aiFlowchart: FC_PHOTOBOOTH,
      communicationFlows: ["Email plain", "WhatsApp"],
      userDataCaptured: true,
      dataFields: "Name, Phone, Email, Photo URL",
      dataSharedBack: "Daily digital-strip share-rate report",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "Premium DSLR + lighting rig",
        "4Brains photobooth software",
        "DNP printer (2 copies per shoot)",
        "Operator (1)",
      ],
      clientDeliverables: ["Backdrop design (8x8 ft tension flex)", "EV silhouette vector"],
      deliverablesNote: "Strip layout 2x6 inches, premium 235gsm matte paper.",
      specNotes: "Strip print time <22s. EV silhouette must match official brand silhouette.",
    }),
    activity({
      productId: "leaderboard",
      customProductName: "Brand Quest Leaderboard",
      stationCount: "1",
      description:
        "Cross-pavilion leaderboard hub — visitors earn points by visiting all five activity zones (badge scanned at each). Top 10 displayed at central hub. Daily winner gets a test-drive priority slot + exclusive merch.",
      userJourney:
        "1. Visitor scans badge at zone\n2. Linked to existing profile\n3. Points awarded per zone visited\n4. Live leaderboard updates\n5. Top 10 displayed at central hub\n6. Daily 6pm winner announcement",
      aiFlowchart: FC_LEADERBOARD,
      communicationFlows: [],
      userDataCaptured: true,
      dataFields: "Badge ID, Zone visits, Timestamps, Final points",
      dataSharedBack: "Live dashboard + daily winner export to client",
      clientProvidesData: false,
      dataFormat: "",
      dataNotes: "",
      fourBrainsDeliverables: [
        "RFID readers x 5 (one per zone)",
        "Central leaderboard 75-inch display",
        "Hub software with live sync",
        "Operator at hub (1)",
      ],
      clientDeliverables: [
        "Daily winner prize logistics",
        "Merch inventory (5 days x top 3)",
      ],
      deliverablesNote: "Leaderboard refresh every 30s. Cooldown 60s per zone re-visit.",
      specNotes:
        "Display orientation portrait, 4K. Top 10 with avatars (face-rec captures from Activity 1).",
    }),
  ],

  clientProvidesDesign: true,
  brandGuidelinesSharedYet: true,
  brandGuidelinesFollowUp: "",
  logoFilesReceived: true,
  brandColorsFonts:
    "Northstar Indigo #1A2350, Electric Blue #0E5DA8, Cream #FAF7EE, Charcoal #1F2123 / Inter Tight, Saol Display",
  slotDayDesignVariations: true,
  slotDayDesignVariationsNotes:
    "Day 1 = Press preview (indigo accent), Days 2-3 = Dealer focus (electric blue), Days 4-5 = Public (full palette + heritage zone emphasis).",

  fabricationByClient: true,
  fabricationClientNotes:
    "Northstar in-house team will deliver the EV display car (1:1 reveal model + 1:4 cutaway), the rotating turntable, and the branded reveal-stage scrim. All to arrive May 30.",
  fabricationByFourBrains: true,
  fabricationFourBrainsNotes:
    "Pavilion fitouts — 2,400 sqft exhibit build, custom acrylic AR Table enclosures, RFID pedestals, photobooth backdrop, leaderboard hub structure, all interconnect cable management. Vendors: Praveen Acrylics + Veda Carpentry, refs in deck.",
  oneLineDiagramRequired: true,
  oneLineDiagramNotes:
    "Single-line diagram required for venue submission AND for client safety audit. 4Brains AV + electrical owner — Karthik. Due May 25, including generator backup, EV charging interlock, and emergency cut-off.",
  internetByClient: false,
  internetClientDetails: "",
  internetFourBrainsArrangement:
    "Dedicated 200 Mbps leased fiber to pavilion (Tata Telecom), separate AP per zone with 5GHz isolation, 5G dongle backup. Speedtest log every 15min during event hours.",

  additionalNotes:
    "Pre-event press preview May 28 (Day 0) — only Activity 1 + Activity 2 active. Reveal moment Day 1 at 11am, Activity 2 (AI Twin) opens immediately after. Footfall expected: Day 1 800, Days 2–3 1500/day, Days 4–5 2000/day. Daily PM standup at 8am with client lead. Post-event report due June 13.",
};

// ----------------- Run -----------------

async function pickUserId(): Promise<string> {
  const { data, error } = await supa.from("profiles").select("id, name").limit(1);
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("No user profile found — sign in once via the app first.");
  }
  console.log(`Using profile: ${data[0].name} (${data[0].id})`);
  return data[0].id as string;
}

async function wipeBriefs() {
  // Truncate change_logs first (foreign key), then briefs.
  const { error: e1 } = await supa.from("change_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (e1) throw e1;
  const { error: e2 } = await supa.from("briefs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (e2) throw e2;
  console.log("✓ Wiped existing briefs and change_logs");
}

async function insertBrief(userId: string, data: unknown, status: string) {
  const { data: row, error } = await supa
    .from("briefs")
    .insert({
      created_by_id: userId,
      data,
      status,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (row as { id: string }).id;
}

async function main() {
  const userId = await pickUserId();
  await wipeBriefs();

  const id1 = await insertBrief(userId, BRIEF_1, "DRAFT");
  console.log(`✓ Seeded Brief 1 (1 activity)   — ${id1}`);
  const id2 = await insertBrief(userId, BRIEF_2, "DRAFT");
  console.log(`✓ Seeded Brief 2 (3 activities) — ${id2}`);
  const id3 = await insertBrief(userId, BRIEF_3, "DRAFT");
  console.log(`✓ Seeded Brief 3 (6 activities) — ${id3}`);

  console.log("\nDone. Open the dashboard and the three briefs are ready.");
  console.log("Each activity has a hand-crafted Mermaid flowchart pre-set, so");
  console.log("clicking Edit → Export PDF + Flowchart will produce per-activity");
  console.log("flowchart PNGs alongside the PDF inside the ZIP.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Renders a sample BriefPdfDocument with mock data to ./brief-mockup.pdf
// so you can open it and see the new layout without going through the
// dashboard / export flow.
//
// Run with:  npx tsx scripts/preview-pdf.ts
// Output:    ./brief-mockup.pdf  (project root)

import { renderToFile } from "@react-pdf/renderer";
import path from "node:path";
import { BriefPdfDocument } from "../src/lib/exportPdf";
import type { RenderedSection } from "../src/lib/exportSections";

const sections: RenderedSection[] = [
  {
    index: 1,
    title: "Project & Client Info",
    rows: [
      { label: "Client / Brand", value: "Acme Beverages" },
      { label: "Project / Event", value: "Spring Activation 2026" },
      { label: "POC Name", value: "Anika Verma" },
      { label: "POC Phone", value: "+91 98 7654 3210" },
      { label: "CS/BD Owner", value: "Priya Sharma" },
      { label: "PM Assigned", value: "Rohan Iyer" },
      { label: "Brief Received On", value: "May 4, 2026" },
    ],
  },
  {
    index: 2,
    title: "Event Schedule & Venue",
    rows: [
      { label: "Event Date(s)", value: "May 22, 2026 – May 24, 2026" },
      { label: "City / Cities", value: "Bengaluru" },
      {
        label: "Venue",
        value:
          "Phoenix Marketcity, Whitefield Main Road, Mahadevpura, Bengaluru 560048. Activation zone is the central atrium on the ground floor.",
      },
      { label: "Indoor / Outdoor", value: "Indoor" },
      { label: "Setup Date", value: "May 21, 2026" },
      { label: "Demo Date(s)", value: "May 20, 2026" },
    ],
  },
  {
    index: 3,
    title: "Activities",
    rows: [],
    activities: [
      {
        index: 1,
        title: "Registration Desk – QR + Selfie",
        aiFlowchart: "",
        rows: [
          { label: "Category", value: "Registration" },
          { label: "Activity", value: "Registration Desk – QR + Selfie" },
          { label: "Number of stations / units", value: "2" },
          {
            label: "Description",
            value:
              "Visitors scan a QR at the entrance, take a quick selfie at the iPad-mounted station, and receive a personalised badge that prints in under 8 seconds. Counter staff handles edge cases (no phone, badge reprint).",
          },
          {
            label: "User Journey",
            value:
              "1. Scan QR\n2. Selfie capture\n3. Confirm name + room assignment\n4. Personalised badge prints\n5. Hostess hands over badge",
          },
          {
            label: "Communication / Invite Flow",
            value: "Email + QR, WhatsApp + QR",
          },
          {
            label: "4Brains will provide",
            value:
              "iPad x 2, Brother dye-sub printer x 2, registration software, on-ground operator (1)",
          },
          {
            label: "Client will provide",
            value:
              "Pre-event guest list (Excel), table + power, Wi-Fi access (separate SSID)",
          },
          { label: "User Data Captured", value: "Yes" },
          {
            label: "Data Fields",
            value: "Name, Company, Designation, Room Assignment, Photo",
          },
          {
            label: "How Shared Back",
            value: "CSV via email + live dashboard during the event",
          },
          { label: "Client Provides Pre-existing Data", value: "Yes" },
          { label: "Data Format", value: "Excel" },
        ],
      },
      {
        index: 2,
        title: "AI Caricature Booth",
        aiFlowchart: "",
        rows: [
          { label: "Category", value: "AI Activations" },
          { label: "Activity", value: "AI Caricature Booth" },
          { label: "Number of stations / units", value: "1" },
          {
            label: "Description",
            value:
              "Stylised AI caricature generated from a live capture, then printed on a postcard the visitor can take home. Themed around Acme’s spring brand colours.",
          },
          {
            label: "User Journey",
            value:
              "1. Visitor steps in front of camera\n2. Capture confirmed on screen\n3. AI generates caricature in 12s\n4. User picks 1 of 3 styles\n5. Postcard prints",
          },
          {
            label: "4Brains will provide",
            value:
              "DSLR + lighting, MacBook Pro running model, postcard printer, operator",
          },
          { label: "Client will provide", value: "Brand colour reference" },
          { label: "User Data Captured", value: "No" },
          { label: "Client Provides Pre-existing Data", value: "No" },
        ],
      },
      {
        index: 3,
        title: "Spin-the-Wheel Microsite",
        aiFlowchart: "",
        rows: [
          { label: "Category", value: "Gamification" },
          { label: "Activity", value: "Spin-the-Wheel Microsite" },
          { label: "Number of stations / units", value: "1" },
          {
            label: "Description",
            value:
              "QR-launched microsite with a branded wheel. Three prize tiers — sample pack, branded merch, grand prize entry.",
          },
          { label: "User Data Captured", value: "Yes" },
          { label: "Data Fields", value: "Name, Phone, Spin result" },
          { label: "How Shared Back", value: "Live dashboard + post-event CSV" },
          { label: "Client Provides Pre-existing Data", value: "No" },
        ],
      },
    ],
  },
  {
    index: 4,
    title: "Design & Branding",
    rows: [
      { label: "Design / Brand Guidelines Source", value: "Client provides" },
      { label: "Brand Guidelines Shared", value: "Yes" },
      { label: "Logo Files Received", value: "Yes" },
      { label: "Brand Colors / Fonts", value: "#0E5DA8, #F2C94C / Inter, DM Serif Display" },
    ],
  },
  {
    index: 5,
    title: "Fabrication & On-site",
    rows: [
      { label: "Fabrication — Client side", value: "Yes" },
      {
        label: "Client provides",
        value:
          "8ft x 6ft branded backdrop frame (shipping from Mumbai office), entry arch, counter graphics flex prints.",
      },
      { label: "Fabrication — 4Brains side", value: "Yes" },
      {
        label: "4Brains will fabricate",
        value:
          "Custom acrylic activity station enclosures (2 x reg desk, 1 x AI booth), branded vinyl wraps, internal cable routing channels. Vendor: Praveen Acrylics, refs in deck.",
      },
      { label: "One-line Diagram (1LD)", value: "Yes" },
      {
        label: "1LD notes",
        value:
          "Power + signal flow diagram needed for venue submission. 4Brains AV team to share by May 12. Includes generator backup loop.",
      },
      { label: "Internet Provided by Client", value: "No" },
      {
        label: "4Brains Internet Arrangement",
        value: "Jio Postpaid 5G hotspot dedicated to activation zone, backup Airtel dongle on standby.",
      },
    ],
  },
  {
    index: 6,
    title: "Additional Notes",
    rows: [
      {
        label: "Notes",
        value:
          "Soft launch on Day 1 between 4–7pm with C-suite walk-through. Footfall expected at ~600/day on Sat-Sun. Ensure backup printer ribbons on-site.",
      },
    ],
  },
];

async function main() {
  const out = path.join(process.cwd(), "brief-mockup.pdf");
  await renderToFile(
    BriefPdfDocument({
      projectName: "Spring Activation 2026",
      clientName: "Acme Beverages",
      csName: "Priya Sharma",
      pmName: "Rohan Iyer",
      generatedDate: "May 7, 2026",
      sections,
      activityFlowcharts: {},
    }) as never,
    out,
  );
  console.log("Wrote", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

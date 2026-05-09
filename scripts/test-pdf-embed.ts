// Validates that BriefPdfDocument actually embeds the activityFlowcharts
// PNG buffers inline. We synthesize a small PNG, hand it to the renderer,
// and write a real PDF you can open + verify visually.
import { renderToFile } from "@react-pdf/renderer";
import * as fs from "node:fs";
import * as path from "node:path";
import { BriefPdfDocument } from "../src/lib/exportPdf";
import type { RenderedSection } from "../src/lib/exportSections";

function tinyPng(): Buffer {
  return fs.readFileSync("/tmp/test-flow.png");
}

const sections: RenderedSection[] = [
  {
    index: 3,
    title: "Activities",
    rows: [],
    activities: [
      {
        index: 1,
        title: "Test Activity 1",
        aiFlowchart: "",
        rows: [
          { label: "Category", value: "Registration" },
          { label: "Activity", value: "Test 1" },
          { label: "Number of stations / units", value: "2" },
          { label: "Description", value: "First test activity to verify embedded flowchart." },
          { label: "User Journey", value: "1. Step\n2. Step\n3. Step" },
        ],
      },
      {
        index: 2,
        title: "Test Activity 2",
        aiFlowchart: "",
        rows: [
          { label: "Category", value: "AI Activations" },
          { label: "Activity", value: "Test 2" },
          { label: "Number of stations / units", value: "1" },
          { label: "Description", value: "Second test activity, also with embedded flowchart." },
          { label: "User Journey", value: "1. Step\n2. Step" },
        ],
      },
    ],
  },
];

async function main() {
  const png = tinyPng();
  const out = path.join(process.cwd(), "test-pdf-embed.pdf");
  await renderToFile(
    BriefPdfDocument({
      projectName: "PDF Embed Smoke Test",
      clientName: "Test",
      csName: "Test CS",
      pmName: "Test PM",
      generatedDate: "Now",
      sections,
      activityFlowcharts: { 1: png, 2: png },
    }) as never,
    out,
  );
  const stat = fs.statSync(out);
  console.log("Wrote", out, "(", stat.size, "bytes )");
}
main().catch((e) => { console.error(e); process.exit(1); });

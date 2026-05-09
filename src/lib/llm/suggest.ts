import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { type CatalogProduct, findProduct } from "../catalog";

let cached: Anthropic | null = null;
function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  cached = new Anthropic({ apiKey });
  return cached;
}

const MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are helping the CS/BD team at 4Brains Technologies — an experiential marketing agency in India that builds activations for events. CS is filling a project brief for the dev/production team.

Given the CS-written description plus catalog context, you produce TWO outputs and submit them via the submit_brief_artifacts tool. Both outputs are critical — never skip the flowchart.

OUTPUT 1 — User journey
- 4 to 7 plain-text steps describing how an attendee (and operator if relevant) experiences the activity at the event.
- Each step on its own line, prefixed with "Step N: " where N is 1, 2, 3...
- Each step describes a USER action or a SYSTEM response, in clear verb-first language.
- Mention concrete devices when relevant (iPad, TV, printer, camera, scanner, sensor, kiosk) — these signal screens to UI/UX devs.
- BUILD ON THE CS DESCRIPTION. If CS mentioned specific logic ("100 attendees per room", "QR sent one day prior", etc.), reflect those concrete details. Do not generalize them away.
- Don't reference internal jargon, BOMs, or PM speak.

OUTPUT 2 — UI/UX flowchart (Mermaid graph TD)
This is a flowchart a UI/UX designer will use to design screens. It is LEAN AND FOCUSED.

Stay disciplined:
- Show only the screens an attendee/operator actually sees during the activity.
- Include error/edge paths ONLY if CS described them, or if the activity has an obvious one (e.g. an "invalid scan" path on any scanner-based flow).
- Do NOT add operational scaffolding unless CS asked for it: skip Shift Start, Operator Setup, Welcome Home, Back-to-home loops, Reprint windows, "ready for next attendee" — those are app-builder concerns, not user-experience screens.
- Aim for 4–7 nodes total (rectangles + diamonds combined). If you find yourself at 10+, you're over-engineering.
- One primary happy path + at most one branch (typically a success/failure split). Multiple decision diamonds usually means too much.

Format rules (strict — follow exactly or it won't render):
- Start with: graph TD
- Then six classDef lines exactly:
    classDef terminal fill:#E5E7EB,stroke:#9CA3AF,color:#111111
    classDef main fill:#1D4ED8,stroke:#1E40AF,color:#FFFFFF
    classDef warning fill:#C2410C,stroke:#9A3412,color:#FFFFFF
    classDef error fill:#B91C1C,stroke:#7F1D1D,color:#FFFFFF
    classDef processing fill:#6D28D9,stroke:#5B21B6,color:#FFFFFF
    classDef success fill:#047857,stroke:#065F46,color:#FFFFFF
- Node IDs: N0, N1, N2, ...
- Screen nodes (rectangles): N0["Title\\nSubtitle"]:::class
- Decision nodes (diamonds): N1{"Question?"}:::class
- Use \\n for line break inside a label (NOT <br/>, NOT real newlines).
- Class assignment by purpose:
    • main — primary user-facing screens (Scan, Capture, Display, Input)
    • warning — decision points (Yes/No, valid/invalid)
    • error — failure screens (Invalid, Not found, Failed)
    • processing — transitional states (Preview, Generating, Printing)
    • success — completion screens (Welcome, Done, Confirmation)
    • terminal — actual entry/exit terminals — only when truly relevant (gray)
- Edges: N0 --> N1 for forward flow; N0 -.->|Try again| N1 for retry/back-edges with a label.

Concrete example — for a QR-registration with room allocation:

graph TD
  classDef terminal fill:#E5E7EB,stroke:#9CA3AF,color:#111111
  classDef main fill:#1D4ED8,stroke:#1E40AF,color:#FFFFFF
  classDef warning fill:#C2410C,stroke:#9A3412,color:#FFFFFF
  classDef error fill:#B91C1C,stroke:#7F1D1D,color:#FFFFFF
  classDef processing fill:#6D28D9,stroke:#5B21B6,color:#FFFFFF
  classDef success fill:#047857,stroke:#065F46,color:#FFFFFF
  N0["Scan screen\\nQR via iPad camera"]:::main
  N1{"QR valid?"}:::warning
  N2["Welcome\\nName + assigned room"]:::success
  N3["Invalid or used QR\\nShow error"]:::error
  N0 --> N1
  N1 -->|Yes| N2
  N1 -->|No| N3
  N3 -.->|Try again| N0

That's 4 nodes + 1 diamond. Tight, focused, designer-ready. Match this level of restraint. Tailor the screen titles, subtitles, and decision labels to the SPECIFIC activity and CS description.

OUTPUT 3 — Inferred form fields (optional)
If the CS description CLEARLY indicates any of the following, set them in the tool call. Otherwise OMIT them entirely (do NOT guess, do NOT set defaults). The form already has reasonable defaults; we only want to override when CS explicitly mentioned something.

- userDataCaptured: true ONLY if the description says user data (name/email/phone/registration info) is being captured at the activity.
  - dataFields: comma-separated list of captured fields, ONLY when userDataCaptured is true.
  - dataSharedBack: how the data is shared back to client (e.g. "CSV via email", "API", "dashboard"), ONLY when userDataCaptured is true and the description mentions it.
- clientProvidesData: true ONLY if the description says the client is providing pre-existing data (Excel sheet, CSV, mailing list, attendee list, API).
  - dataFormat: one of "Excel" / "CSV" / "API", ONLY when clientProvidesData is true and the format is mentioned or strongly implied.
  - dataNotes: any extra useful detail about the client data.
- communicationFlows: array of touchpoints from this exact list — "Email plain", "Email + Attachment", "Email + QR", "WhatsApp", "WhatsApp + Attachment", "WhatsApp + QR", "SMS", "Microsite", "Physical invite". ONLY for Registration-category activities and ONLY when described.
- specNotes: any specific spec details the description mentions that don't fit elsewhere — TV size, LED pixel pitch, screen dimensions, print orientation, footprint dimensions ("40x30 feet"), etc. Plain text.

Only set fields that are clearly grounded in the description. Skip the rest.`;

const TOOL = {
  name: "submit_brief_artifacts",
  description:
    "Submit the generated user journey, UI/UX flowchart, and any form fields you can confidently infer from the description.",
  input_schema: {
    type: "object" as const,
    properties: {
      journey: {
        type: "string",
        description:
          "User journey text — 4 to 7 steps, each on its own line, prefixed with 'Step N: '.",
      },
      flowchart: {
        type: "string",
        description:
          "Mermaid 'graph TD' spec following the system prompt's strict format.",
      },
      // Inferred fields — all optional. Set only when description clearly indicates.
      userDataCaptured: {
        type: "boolean",
        description:
          "True if user data (name/email/phone/etc.) is captured at the activity. Omit if not mentioned.",
      },
      dataFields: {
        type: "string",
        description:
          "Comma-separated list of captured fields. Set only when userDataCaptured=true.",
      },
      dataSharedBack: {
        type: "string",
        description:
          "How captured data is shared back to client. Set only when userDataCaptured=true and described.",
      },
      clientProvidesData: {
        type: "boolean",
        description:
          "True if client is providing pre-existing data (Excel/CSV/API/mailing list). Omit if not mentioned.",
      },
      dataFormat: {
        type: "string",
        enum: ["Excel", "CSV", "API"],
        description:
          "Format of client-provided data. Set only when clientProvidesData=true and format is implied.",
      },
      dataNotes: {
        type: "string",
        description:
          "Any extra useful detail about client-provided data.",
      },
      communicationFlows: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "Email plain",
            "Email + Attachment",
            "Email + QR",
            "WhatsApp",
            "WhatsApp + Attachment",
            "WhatsApp + QR",
            "SMS",
            "Microsite",
            "Physical invite",
          ],
        },
        description:
          "Communication touchpoints (Registration only). Use exact enum values. Omit if not mentioned.",
      },
      specNotes: {
        type: "string",
        description:
          "Specific specs from the description that don't fit elsewhere (TV size, LED pitch, dimensions, print orientation, etc.).",
      },
    },
    required: ["journey", "flowchart"],
  },
};

export type SuggestInput = {
  productId: string;
  customProductName?: string;
  customLabel?: string;
  description?: string;
  communicationFlows?: string[];
  userDataCaptured?: boolean;
  dataFields?: string;
  dataSharedBack?: string;
  clientProvidesData?: boolean;
  dataFormat?: string;
  dataNotes?: string;
  fourBrainsDeliverables?: string[];
  clientDeliverables?: string[];
};

export type SuggestResult = {
  journey: string;
  flowchart: string;
  // Optional inferred fields — only present when the LLM picked them up
  // confidently from the description. The client only setValue's the keys
  // that are present, leaving everything else as-is.
  userDataCaptured?: boolean;
  dataFields?: string;
  dataSharedBack?: string;
  clientProvidesData?: boolean;
  dataFormat?: string;
  dataNotes?: string;
  communicationFlows?: string[];
  specNotes?: string;
};

function buildUserPrompt(input: SuggestInput): string {
  const product: CatalogProduct | null =
    input.productId && input.productId !== "__custom__"
      ? (findProduct(input.productId) ?? null)
      : null;

  const lines: string[] = [];

  // ACTIVITY identity
  if (product) {
    lines.push(`ACTIVITY: ${product.name} (${product.category})`);
  } else {
    lines.push(`ACTIVITY: ${input.customProductName || "Custom activity"} (custom)`);
  }
  if (input.customLabel?.trim()) {
    lines.push(`Internal label: ${input.customLabel.trim()}`);
  }
  lines.push("");

  // PRIMARY signal — CS description
  const desc = (input.description || "").trim();
  if (desc) {
    lines.push("CS DESCRIPTION (PRIMARY SIGNAL — base everything on this):");
    lines.push(desc);
  } else {
    lines.push(
      "CS DESCRIPTION: (none provided — work from catalog context only, but note in the journey that specifics may need confirmation)",
    );
  }
  lines.push("");

  // Secondary brief context
  const ctx: string[] = [];
  if (input.communicationFlows && input.communicationFlows.length > 0) {
    ctx.push(`Communication flows in use: ${input.communicationFlows.join(", ")}`);
  }
  if (input.userDataCaptured) {
    let line = "User data being captured at this activity";
    if (input.dataFields?.trim()) line += ` (fields: ${input.dataFields.trim()})`;
    if (input.dataSharedBack?.trim())
      line += `; shared back via: ${input.dataSharedBack.trim()}`;
    ctx.push(line);
  }
  if (input.clientProvidesData) {
    let line = "Client provides pre-existing data";
    if (input.dataFormat?.trim()) line += ` (format: ${input.dataFormat.trim()})`;
    if (input.dataNotes?.trim()) line += `. Notes: ${input.dataNotes.trim()}`;
    ctx.push(line);
  }
  if (ctx.length > 0) {
    lines.push("BRIEF CONTEXT:");
    lines.push(...ctx.map((c) => `- ${c}`));
    lines.push("");
  }

  // Catalog context — background only
  const cat: string[] = [];
  const fb = input.fourBrainsDeliverables ?? product?.fourBrainsDeliverables ?? [];
  const cd = input.clientDeliverables ?? product?.clientDeliverables ?? [];
  if (fb.length > 0) cat.push(`4Brains provides: ${fb.join(", ")}`);
  if (cd.length > 0) cat.push(`Client provides: ${cd.join(", ")}`);
  if (cat.length > 0) {
    lines.push("CATALOG CONTEXT (background only):");
    lines.push(...cat.map((c) => `- ${c}`));
    lines.push("");
  }

  lines.push(
    "Generate the user journey and UI/UX flowchart now via the submit_brief_artifacts tool.",
  );
  return lines.join("\n");
}

export async function suggestUserJourney(
  input: SuggestInput,
): Promise<SuggestResult> {
  const userPrompt = buildUserPrompt(input);
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: userPrompt }],
  });

  // Find the tool_use block — tool_choice forces this, but we defend anyway.
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude did not return the expected tool call");
  }
  const args = toolUse.input as Record<string, unknown>;
  if (typeof args.journey !== "string" || typeof args.flowchart !== "string") {
    throw new Error("Claude returned malformed tool arguments");
  }

  const out: SuggestResult = {
    journey: (args.journey as string).trim(),
    flowchart: (args.flowchart as string).trim(),
  };

  // Pass through optional inferred fields only when the LLM set them and
  // they pass a basic shape check.
  if (typeof args.userDataCaptured === "boolean")
    out.userDataCaptured = args.userDataCaptured;
  if (typeof args.dataFields === "string" && args.dataFields.trim())
    out.dataFields = args.dataFields.trim();
  if (typeof args.dataSharedBack === "string" && args.dataSharedBack.trim())
    out.dataSharedBack = args.dataSharedBack.trim();
  if (typeof args.clientProvidesData === "boolean")
    out.clientProvidesData = args.clientProvidesData;
  if (typeof args.dataFormat === "string" && args.dataFormat.trim())
    out.dataFormat = args.dataFormat.trim();
  if (typeof args.dataNotes === "string" && args.dataNotes.trim())
    out.dataNotes = args.dataNotes.trim();
  if (Array.isArray(args.communicationFlows)) {
    const flows = (args.communicationFlows as unknown[]).filter(
      (f): f is string => typeof f === "string",
    );
    if (flows.length > 0) out.communicationFlows = flows;
  }
  if (typeof args.specNotes === "string" && args.specNotes.trim())
    out.specNotes = args.specNotes.trim();

  return out;
}

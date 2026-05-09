// Keyword-based FlowchartGenerator.
//
// Reads each line of the CS-typed user journey, classifies it into a UX
// screen type, and produces a short title + subtitle a developer can scan.
// The renderer downstream (./mermaid.ts) turns the graph into a styled
// Mermaid spec.
//
// This is intentionally simple — when the team approves an LLM swap,
// replace the `generate` impl with an API-backed one. The interface
// (UxGraph) stays the same so nothing downstream has to change.

import type {
  FlowchartGenerator,
  NodeKind,
  UxEdge,
  UxGraph,
  UxNode,
} from "./types";

type Rule = {
  match: RegExp;
  kind: NodeKind;
  title: string;
};

// Order matters — first match wins, so put more specific patterns first.
const RULES: Rule[] = [
  // Terminal (end) — handover / "hand over" / "handed over" / entering the
  // venue at the tail of a registration flow.
  {
    match: /\b(handover|hand(ed|s)?\s+(over|off)|hand[- ]?over|hand\s+it\s+over|exit(s|ed)?|leave(s|d)?\b|end\b|enter(s|ed)?\s+(the\s+)?venue)/i,
    kind: "terminal",
    title: "End",
  },
  // Terminal (start) — approach / arrive / walk in
  {
    match: /\b(arriv(e|es|ed|al|ing)?|approach(es|ing|ed)?|walks?\s+(in|up|to)|begins?\b|begin\s+|starts?\b)/i,
    kind: "terminal",
    title: "Start",
  },
  // Success
  {
    match: /\b(success|thank\s*you|complete[ds]?|finish(ed)?|deliver(ed|s)?|share[ds]?\s+with|sent\s+to\s+user|received|got\s+(badge|certificate|gift))\b/i,
    kind: "success",
    title: "Success screen",
  },
  // Error / not-found
  {
    match: /\b(not\s+found|error|fail(ed|ure)?|missing|invalid|reject(ed)?)\b/i,
    kind: "error",
    title: "Error screen",
  },
  // Disambiguation / ambiguity
  {
    match: /\b(multiple\s+match|disambig|ambigu|too\s+many|more\s+than\s+one)\b/i,
    kind: "warning",
    title: "Disambiguation",
  },
  // Processing — printing
  {
    match: /\b(print(s|ed|ing)?)\b/i,
    kind: "processing",
    title: "Printing state",
  },
  // Processing — preview / verify / confirm
  {
    match: /\b(previews?|previewing|previewed|verif(y|ies|ied)|confirm(s|ed|ing)?|reviews?|check(s|ed)?|approves?|approved)\b/i,
    kind: "processing",
    title: "Preview screen",
  },
  // Processing — AI / generation / creation / rendering
  {
    match: /\b(ai|generat(e|es|ing|ed)|create[ds]?|creating|render(s|ing|ed)?|process(es|ing|ed)?|stable\s+diffusion)\b/i,
    kind: "processing",
    title: "Processing",
  },
  // Processing — fetch / lookup / database / backend
  {
    match: /\b(fetch(es|ed|ing)?|lookup|look\s+up|search(es|ed|ing)?\b|find(s|ing)?|retriev(e|es|ed|ing)|database|backend|api\s+call|loads?|loading)\b/i,
    kind: "processing",
    title: "Lookup screen",
  },
  // Main — scan QR / RFID / barcode
  {
    match: /\b(qr|rfid|barcode|nfc|scan(ned|s|ning)?)\b/i,
    kind: "main",
    title: "Scanning screen",
  },
  // Main — face capture / camera / photo
  {
    match: /\b(face|capture(s|d|ing)?|camera|photo|picture|selfie|videobooth|photobooth)\b/i,
    kind: "main",
    title: "Capture screen",
  },
  // Main — provides Name / ID  →  Search/Identification screen
  {
    match: /\b(name\s+or\s+(unique\s+)?id|identification|provides?\s+(their\s+)?(name|id)|looks?\s+up\s+(by\s+)?(name|id))\b/i,
    kind: "main",
    title: "Search screen",
  },
  // Main — input / type / enter (data)
  {
    match: /\b(enter(s|ed)?\s+(name|email|details|info|data)|types?|input|fill(s|ed)?\s+(in|out)?|provides?\s+(details|info|data))\b/i,
    kind: "main",
    title: "Input screen",
  },
  // Main — game / play
  {
    match: /\b(plays?|game|score|leader\s*board|round)\b/i,
    kind: "main",
    title: "Game screen",
  },
  // Main — selection / choose / pick / option
  {
    match: /\b(select(s|ed)?|choose|chose|chosen|pick(s|ed)?|option(s)?\s+(of|for))\b/i,
    kind: "main",
    title: "Selection screen",
  },
  // Main — show / display / view
  {
    match: /\b(displays?|shows?|views?|see(s|n)?)\b/i,
    kind: "main",
    title: "Display screen",
  },
  // Main — setup / configure / login / admin
  {
    match: /\b(setup|set\s+up|configure|admin|operator|login|sign\s+in)\b/i,
    kind: "main",
    title: "Setup screen",
  },
];

// Strip leading list/step markers so titles + subtitles are clean.
function stripPrefix(line: string): string {
  return line
    .trim()
    .replace(
      /^(?:step\s*\d+\s*[:.\-]?\s*|\d+\s*[.)]\s*|[-*•]\s*)/i,
      "",
    )
    .trim();
}

// Build a tidy subtitle: drop the boilerplate "User …" / "Operator …" prefix
// and trim to ~60 chars so nodes don't blow up.
function makeSubtitle(text: string): string {
  const cleaned = text
    .replace(/^(the\s+)?(user|participant|operator|attendee|guest)\s+/i, "")
    .replace(/^[a-z]/, (c) => c.toUpperCase())
    .trim();
  return cleaned.length > 60 ? cleaned.slice(0, 57) + "…" : cleaned;
}

function classify(line: string): { kind: NodeKind; title: string } {
  for (const rule of RULES) {
    if (rule.match.test(line)) {
      return { kind: rule.kind, title: rule.title };
    }
  }
  // Default: a plain main screen with the line as title-cased subtitle.
  return { kind: "main", title: "Step" };
}

export function classifyJourney(userJourney: string): UxGraph {
  const lines = userJourney
    .split("\n")
    .map(stripPrefix)
    .filter(Boolean);

  if (lines.length === 0) return { nodes: [], edges: [] };

  const nodes: UxNode[] = lines.map((line, i) => {
    const { kind, title } = classify(line);
    return {
      id: `N${i}`,
      kind,
      title,
      subtitle: makeSubtitle(line),
    };
  });

  const edges: UxEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  }

  return { nodes, edges };
}

export const keywordGenerator: FlowchartGenerator = {
  generate(userJourney: string): UxGraph {
    return classifyJourney(userJourney);
  },
};

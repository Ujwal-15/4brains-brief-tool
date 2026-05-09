// Render a UxGraph to a Mermaid `graph TD` spec with class-based styling
// matching the reference flowchart (terminal=gray, main=blue, warning=orange,
// error=red, processing=purple, success=green).
//
// IMPORTANT: we run Mermaid with htmlLabels:false + securityLevel:strict for
// safety, which means HTML tags inside node labels (<br/>, <i>, etc.) are
// stripped or cause render errors depending on mermaid version. So we use
// plain text only and rely on `\n` for line breaks (Mermaid honors `\n` in
// quoted-string labels natively).

import type { UxGraph } from "./types";

function escapeLabel(s: string): string {
  // Strip characters that break mermaid's label parser, then trim length so
  // the rendered SVG nodes don't blow up.
  return s
    .replace(/[\[\]"`<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function graphToMermaid(graph: UxGraph): string {
  if (graph.nodes.length === 0) return "";

  const lines: string[] = [
    "graph TD",
    "  classDef terminal fill:#E5E7EB,stroke:#9CA3AF,color:#111111",
    "  classDef main fill:#1D4ED8,stroke:#1E40AF,color:#FFFFFF",
    "  classDef warning fill:#C2410C,stroke:#9A3412,color:#FFFFFF",
    "  classDef error fill:#B91C1C,stroke:#7F1D1D,color:#FFFFFF",
    "  classDef processing fill:#6D28D9,stroke:#5B21B6,color:#FFFFFF",
    "  classDef success fill:#047857,stroke:#065F46,color:#FFFFFF",
  ];

  for (const node of graph.nodes) {
    const title = escapeLabel(node.title);
    const sub = node.subtitle ? escapeLabel(node.subtitle) : "";
    // Use `\n` (literal backslash-n in the source string) for a line break
    // inside the label — Mermaid renders this as multi-line text in the node.
    const label = sub ? `${title}\\n${sub}` : title;
    lines.push(`  ${node.id}["${label}"]:::${node.kind}`);
  }

  for (const edge of graph.edges) {
    const arrow = edge.dashed ? "-.->" : "-->";
    const label = edge.label ? `|${escapeLabel(edge.label)}|` : "";
    lines.push(`  ${edge.from} ${arrow}${label} ${edge.to}`);
  }

  return lines.join("\n");
}

// Client-side helpers for exporting a brief.
//
// Two-step flow:
//   1. We render Mermaid → SVG in the BROWSER (Mermaid is browser-only).
//      The SVG string is what Mermaid produces — we don't do canvas
//      rasterization here. We tried; canvas in the browser was a
//      bottomless rabbit hole of CORS/taint/style/parser quirks.
//   2. We ship the SVG STRING to the server in the export multipart
//      payload. The server (Vercel function) rasterizes SVG→PNG via
//      @resvg/resvg-js (pure-JS port of resvg, no native deps), then
//      embeds the PNG in the final PDF.
//
// Everything related to <img>/canvas/dataURL/DOMParser is gone. Server-side
// SVG rendering with resvg is deterministic and immune to browser flakes.

import { generateFlowchart } from "./flowchart";

// Strip Mermaid features that the resvg server-side renderer doesn't honour
// (it doesn't run a CSS engine for theme classes). Mermaid's plain node
// rect/diamond/text output works fine; classDef + :::class CSS theming
// wouldn't apply anyway.
export function sanitizeMermaidForRender(src: string): string {
  return src
    .split("\n")
    .filter((line) => !line.trim().startsWith("classDef"))
    .map((line) => line.replace(/:::[A-Za-z_][A-Za-z0-9_-]*/g, ""))
    .join("\n");
}

// Render Mermaid source → SVG string. Browser-only; the page already
// dynamic-imports mermaid in MermaidPreview.tsx so the bundle is warm.
async function renderMermaidSvg(source: string): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "strict",
    flowchart: { htmlLabels: false, curve: "basis" },
  });
  const sanitized = sanitizeMermaidForRender(source);
  const id = `m_export_${Date.now()}`;
  const { svg } = await mermaid.render(id, sanitized);
  return svg;
}

// Build one Mermaid SVG string per activity. Prefers the LLM-generated
// `aiFlowchart` (set by the Suggest button) so the exported chart matches
// what CS sees on screen; falls back to the keyword classifier rendering
// of the typed journey text when the LLM spec isn't there.
//
// Returns a Map<activityIndex, svgString>. The export route will send
// each SVG string to the server which renders it to PNG via resvg.
export async function buildFlowchartSvgsForActivities(
  activities: Array<{ userJourney: string; aiFlowchart?: string }>,
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  console.groupCollapsed(
    `[export] rendering ${activities.length} activity flowcharts (SVG only)`,
  );
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    if (!a) continue;

    const llmSpec = (a.aiFlowchart ?? "").trim();
    const source = llmSpec || generateFlowchart(a.userJourney ?? "");
    const sourceKind = llmSpec ? "aiFlowchart" : "keyword-fallback";
    if (!source) {
      console.warn(
        `  Activity ${i + 1}: no source (empty journey + no AI spec) — skip`,
      );
      continue;
    }

    try {
      const svg = await renderMermaidSvg(source);
      out.set(i + 1, svg);
      console.log(
        `  ✓ Activity ${i + 1} (${sourceKind}) → SVG ${svg.length} chars`,
      );
    } catch (err) {
      console.error(
        `  ✗ Activity ${i + 1} (${sourceKind}) Mermaid render FAILED:`,
        err,
        "\n    source:",
        source,
      );
    }
  }
  console.log(
    `[export] generated ${out.size}/${activities.length} flowchart SVGs (server will rasterize)`,
  );
  console.groupEnd();
  return out;
}

export type ExportResult = {
  pdfUrl: string;
  pdfName: string;
  flowchartCount: number;
  flowchartErrors?: Array<{ idx: number; reason: string; svgChars: number }>;
};

// Ship the multipart payload to the export route. The server expects
// "flowchart_svg_<idx>" string fields and rasterizes them.
export async function postExport(
  briefId: string,
  flowcharts: Map<number, string>,
): Promise<
  | { ok: true; data: ExportResult }
  | { ok: false; status: number; error: string; missing?: unknown[] }
> {
  const fd = new FormData();
  Array.from(flowcharts.entries()).forEach(([idx, svg]) => {
    fd.append(`flowchart_svg_${idx}`, svg);
  });

  const res = await fetch(`/api/briefs/${briefId}/export`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    let payload: { error?: string; missing?: unknown[] } = {};
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      // ignore
    }
    return {
      ok: false,
      status: res.status,
      error: payload.error || `Export failed (${res.status})`,
      missing: payload.missing,
    };
  }

  const data = (await res.json()) as ExportResult;
  if (data.flowchartErrors && data.flowchartErrors.length > 0) {
    console.error(
      "[export] server-side resvg failed to rasterize some flowcharts:",
      data.flowchartErrors,
    );
  }
  return { ok: true, data };
}

// Triggers a same-window download. Avoids target="_blank" so popup
// blockers don't kill the file-save dialog.
export function triggerDownload(url: string, filename?: string) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

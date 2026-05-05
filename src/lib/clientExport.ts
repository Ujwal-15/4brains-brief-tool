// Client-side helpers for exporting a brief.
//
// Mermaid is browser-only — we render the diagram in the browser, draw the SVG
// to a canvas, and ship a PNG to the server.

import { parseJourneySteps, stepsToMermaid } from "./briefSchema";

async function renderMermaidSvg(source: string): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  // Initialize is idempotent within a single page.
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "strict",
    flowchart: { htmlLabels: false, curve: "basis" },
  });
  const id = `m_export_${Date.now()}`;
  const { svg } = await mermaid.render(id, source);
  return svg;
}

async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  // Make sure the SVG declares an explicit size — some browsers need it for
  // canvas rasterization.
  const wrapped = svg.includes("xmlns=")
    ? svg
    : svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');

  const blob = new Blob([wrapped], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load Mermaid SVG"));
      img.src = url;
    });

    // Some browsers report 0 dimensions for SVGs without explicit width/height.
    // Fall back to viewBox or sensible defaults.
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (!width || !height) {
      const m = wrapped.match(/viewBox="([\d.\s-]+)"/);
      if (m) {
        const parts = m[1].split(/\s+/).map(Number);
        width = parts[2] || 800;
        height = parts[3] || 600;
      } else {
        width = 800;
        height = 600;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function buildFlowchartPng(
  userJourney: string,
): Promise<Blob | null> {
  const steps = parseJourneySteps(userJourney);
  if (steps.length === 0) return null;
  const source = stepsToMermaid(steps);
  if (!source) return null;
  const svg = await renderMermaidSvg(source);
  return svgToPngBlob(svg);
}

export type ExportResult = {
  pdfUrl: string;
  flowchartUrl: string | null;
  zipUrl: string;
  zipName: string;
};

export async function postExport(
  briefId: string,
  flowchartPng: Blob | null,
): Promise<
  | { ok: true; data: ExportResult }
  | { ok: false; status: number; error: string; missing?: unknown[] }
> {
  const fd = new FormData();
  if (flowchartPng) fd.append("flowchart", flowchartPng, "flowchart.png");

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
  return { ok: true, data };
}

export function triggerDownload(url: string, filename?: string) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

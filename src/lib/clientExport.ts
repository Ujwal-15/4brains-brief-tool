// Client-side helpers for exporting a brief.
//
// Mermaid is browser-only — we render the diagram in the browser, draw the SVG
// to a canvas, and ship a PNG to the server.

import { generateFlowchart } from "./flowchart";

// Strip Mermaid features that break our SVG-to-canvas rasterization:
//   - `classDef foo fill:#xxx,...`  declarations (CSS rules in <style>)
//   - `:::foo`                      class-assignment suffix on nodes
//
// These add CSS-based styling to the SVG which our <img> + canvas path
// can't honour (we strip <style> blocks during normalize). Stripping them
// here gives Mermaid plain rect/diamond/text/edge output that we re-style
// with inline fill attributes during normalizeSvgForRaster.
//
// We INTENTIONALLY keep `\n` line breaks inside labels — Mermaid handles
// them natively and sizes node heights to fit multi-line text. Removing
// them produced single-line text that Mermaid then word-wrapped visually
// without growing the box, causing the wrapped second line to clip.
export function sanitizeMermaidForRender(src: string): string {
  return src
    .split("\n")
    .filter((line) => !line.trim().startsWith("classDef"))
    .map((line) => line.replace(/:::[A-Za-z_][A-Za-z0-9_-]*/g, ""))
    .join("\n");
}

async function renderMermaidSvg(source: string): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  // Initialize is idempotent within a single page.
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

// Normalises a Mermaid-output SVG so canvas rasterization actually works
// AND the rendered output is readable (white nodes, dark text, dark arrows).
//
// Failure modes we defend against (all observed in the wild):
//   1. Mermaid emits `width="100%"`. <img> reports naturalWidth=0 and
//      drawImage draws nothing → empty PNG.
//   2. SVGs without an explicit xmlns fail to decode in some browsers.
//   3. Mermaid inlines a `<style>` block. Some browsers refuse to load
//      <img src=...> SVGs that have <style> with font-family refs, throwing
//      [object Event] from onerror. We strip the block.
//   4. After stripping styles, default browser rendering paints rects and
//      text in BLACK (the SVG default fill), so the user sees black-on-black
//      boxes. We push fill/stroke/color attributes inline onto each shape
//      and text element so the colour comes from attributes, not CSS.
//   5. Mermaid's auto-computed dimensions are floats (572.265625). Some
//      browsers stumble on fractional <svg> width/height. We round.
function normalizeSvgForRaster(svg: string): {
  svg: string;
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;

  // 1. xmlns
  if (!root.getAttribute("xmlns")) {
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  // 2. Compute integer dimensions from viewBox
  const viewBox = root.getAttribute("viewBox") || "";
  const vbParts = viewBox.split(/\s+/).map(Number);
  const width =
    vbParts.length >= 4 && Number.isFinite(vbParts[2])
      ? Math.max(Math.round(vbParts[2]), 100)
      : 800;
  const height =
    vbParts.length >= 4 && Number.isFinite(vbParts[3])
      ? Math.max(Math.round(vbParts[3]), 100)
      : 600;

  // 3. Explicit width/height (override any "100%")
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));

  // 4. Strip all <style> blocks
  doc.querySelectorAll("style").forEach((el) => el.remove());

  // 5. Inline default colours so the rasterized canvas is readable.
  //    The selectors below cover Mermaid's standard class structure.

  // Node shapes (rectangles, diamonds, etc.) — white fill, dark border
  const NODE_SHAPE_SEL =
    ".node rect, .node polygon, .node circle, .node ellipse, .nodes rect, .nodes polygon, .nodes circle, .nodes ellipse, .basic.label-container, .label-container";
  doc.querySelectorAll(NODE_SHAPE_SEL).forEach((el) => {
    if (!el.getAttribute("fill") || el.getAttribute("fill") === "none") {
      el.setAttribute("fill", "#ffffff");
    }
    if (!el.getAttribute("stroke")) el.setAttribute("stroke", "#333333");
    if (!el.getAttribute("stroke-width")) {
      el.setAttribute("stroke-width", "1.2");
    }
  });

  // Edge label backgrounds — white so labels are readable
  doc.querySelectorAll(".edgeLabel rect, .label rect").forEach((el) => {
    if (!el.getAttribute("fill")) el.setAttribute("fill", "#ffffff");
  });

  // All text — dark fill, sans-serif (avoid the missing-font issue)
  doc.querySelectorAll("text, tspan").forEach((el) => {
    if (!el.getAttribute("fill")) el.setAttribute("fill", "#111111");
    if (el.tagName.toLowerCase() === "text") {
      if (!el.getAttribute("font-family")) {
        el.setAttribute("font-family", "Arial, Helvetica, sans-serif");
      }
    }
  });

  // Edge paths (the lines connecting nodes) — dark stroke, no fill
  doc
    .querySelectorAll(".edgePath path, .edgePaths path, path.path")
    .forEach((el) => {
      if (!el.getAttribute("stroke")) el.setAttribute("stroke", "#333333");
      if (!el.getAttribute("stroke-width")) {
        el.setAttribute("stroke-width", "1.5");
      }
      if (!el.getAttribute("fill")) el.setAttribute("fill", "none");
    });

  // Arrowhead markers — DARK fill (these are inside <marker> elements,
  // typically <path> or <polygon>)
  doc.querySelectorAll("marker path, marker polygon").forEach((el) => {
    el.setAttribute("fill", "#333333");
    el.setAttribute("stroke", "#333333");
  });

  const serializer = new XMLSerializer();
  return { svg: serializer.serializeToString(doc), width, height };
}

// Encode an SVG to a base64 data URL. Base64 is more reliable than
// URL-encoding (encodeURIComponent) for SVG payloads with mixed unicode
// + special characters. The `unescape(encodeURIComponent(...))` dance
// makes btoa UTF-8 safe.
function svgToBase64DataUrl(svg: string): string {
  const utf8 = unescape(encodeURIComponent(svg));
  return `data:image/svg+xml;base64,${btoa(utf8)}`;
}

async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  const { svg: normalized, width, height } = normalizeSvgForRaster(svg);

  // Data URL (not blob URL). Critical for canvas export:
  //   - blob URLs: Chrome/Brave treat SVG-via-blob as cross-origin
  //     in some cases, tainting the canvas → toBlob() throws
  //     SecurityError. Even setting img.crossOrigin doesn't help
  //     because blob URLs don't go through the CORS check.
  //   - data URLs: origin-less, never taint the canvas.
  //
  // Earlier data URLs failed with "image failed to load" — that was
  // really about floats + <style> blocks in the SVG, both of which
  // we strip in normalizeSvgForRaster.
  const dataUrl = svgToBase64DataUrl(normalized);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => {
      // eslint-disable-next-line no-console
      console.error(
        `[svgToPng] <img> failed to load SVG (${width}x${height}). Normalized SVG (first 1000 chars):\n` +
          normalized.slice(0, 1000),
      );
      reject(new Error(`SVG image failed to load (${width}x${height})`));
    };
    img.src = dataUrl;
  });

  if (typeof img.decode === "function") {
    try {
      await img.decode();
    } catch {
      // some old browsers reject decode but img is still drawable
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b && b.size > 0) resolve(b);
      else
        reject(
          new Error(
            `Canvas toBlob produced empty PNG (${canvas.width}x${canvas.height})`,
          ),
        );
    }, "image/png");
  });
}

export async function buildFlowchartPng(
  userJourney: string,
): Promise<Blob | null> {
  const source = generateFlowchart(userJourney);
  if (!source) return null;
  const svg = await renderMermaidSvg(source);
  return svgToPngBlob(svg);
}

// Build one PNG per activity. Prefers the LLM-generated Mermaid spec
// (set by the Suggest button) so the exported chart matches what CS sees
// on screen. Falls back to the keyword classifier rendering of the typed
// journey text when the LLM spec isn't there.
//
// Logs each step so the user / dev can see exactly which activities
// produced PNGs and which failed (and why) in the browser console.
export async function buildFlowchartPngsForActivities(
  activities: Array<{ userJourney: string; aiFlowchart?: string }>,
): Promise<Map<number, Blob>> {
  const out = new Map<number, Blob>();
  console.groupCollapsed(
    `[export] rendering ${activities.length} activity flowcharts`,
  );
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    if (!a) continue;

    const llmSpec = (a.aiFlowchart ?? "").trim();
    const source = llmSpec || generateFlowchart(a.userJourney ?? "");
    const sourceKind = llmSpec ? "aiFlowchart" : "keyword-fallback";
    if (!source) {
      console.warn(`  Activity ${i + 1}: no source (empty journey + no AI spec) — skip`);
      continue;
    }

    try {
      const svg = await renderMermaidSvg(source);
      const png = await svgToPngBlob(svg);
      out.set(i + 1, png);
      console.log(
        `  ✓ Activity ${i + 1} (${sourceKind}) → PNG ${png.size} bytes`,
      );
    } catch (err) {
      console.error(
        `  ✗ Activity ${i + 1} (${sourceKind}) FAILED:`,
        err,
        "\n    source:",
        source,
      );
    }
  }
  console.log(`[export] generated ${out.size}/${activities.length} flowchart PNGs`);
  console.groupEnd();
  return out;
}

export type ExportResult = {
  pdfUrl: string;
  pdfName: string;
  // Number of activity flowcharts embedded in the PDF (purely informational).
  flowchartCount: number;
};

export async function postExport(
  briefId: string,
  flowcharts: Map<number, Blob>,
): Promise<
  | { ok: true; data: ExportResult }
  | { ok: false; status: number; error: string; missing?: unknown[] }
> {
  const fd = new FormData();
  Array.from(flowcharts.entries()).forEach(([idx, png]) => {
    fd.append(`flowchart_${idx}`, png, `activity_${idx}.png`);
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
  return { ok: true, data };
}

// Triggers a same-window download. Avoids target="_blank" because some
// browsers treat that as a popup and block it; with `download` attribute
// only, the file goes straight to disk.
export function triggerDownload(url: string, filename?: string) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Client-side helpers for exporting a brief.
//
// Mermaid is browser-only — we render the diagram in the browser, draw the SVG
// to a canvas, and ship a PNG to the server.

import { generateFlowchart } from "./flowchart";

// Strip Mermaid features that interact badly with our SVG-to-canvas
// rasterization step. Specifically:
//   - `classDef foo fill:#xxx,...`  declarations
//   - `:::foo`                      class-assignment suffix on nodes
//   - `\n` inside quoted labels     forces line breaks via <tspan>,
//                                   which positions inconsistently in
//                                   the rasterized canvas
// All three render fine in Mermaid's own preview but break our
// browser-side <img>→canvas→PNG path in ways that vary by browser. The
// seeded briefs use plain single-line nodes and rasterize reliably; this
// function converts everything to that shape.
// Visual loss is colour theming + multi-line labels — structure is identical.
export function sanitizeMermaidForRender(src: string): string {
  return src
    .split("\n")
    .filter((line) => !line.trim().startsWith("classDef"))
    .map((line) =>
      line
        .replace(/:::[A-Za-z_][A-Za-z0-9_-]*/g, "")
        // Match a literal "\n" (backslash + n) inside the source string —
        // Mermaid treats this as a label line break. Replace with a
        // separator so the label stays on one line.
        .replace(/\\n/g, " — "),
    )
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

// Normalises a Mermaid-output SVG so canvas rasterization actually works.
//
// Failure modes we defend against (all observed in the wild):
//   1. Mermaid emits `width="100%"`. <img> reports naturalWidth=0 and
//      drawImage draws nothing.
//   2. SVGs without an explicit xmlns fail to decode in some browsers.
//   3. Mermaid often inlines a `<style>` block referencing fonts or
//      CSS-variable colors. Some browsers (Chrome/Brave on macOS in
//      certain versions) refuse to load such SVGs into an <img> at all,
//      throwing the generic "[object Event]" onerror. We strip the
//      <style> block — visual cost is colour theming (already gone via
//      sanitizeMermaidForRender); structure stays intact.
//   4. Mermaid's auto-computed dimensions come back as floats
//      (e.g. 572.265625). Some browsers stumble on fractional <svg>
//      width/height. We round.
function normalizeSvgForRaster(svg: string): {
  svg: string;
  width: number;
  height: number;
} {
  let s = svg;

  // 1. Ensure xmlns
  if (!s.includes('xmlns="http://www.w3.org/2000/svg"')) {
    s = s.replace(/<svg(\s)/i, '<svg xmlns="http://www.w3.org/2000/svg"$1');
  }

  // 2. Read intended dimensions from viewBox, round to ints
  let width = 800;
  let height = 600;
  const vb = s.match(/viewBox="([\d.\s-]+)"/i);
  if (vb) {
    const parts = vb[1].split(/\s+/).map(Number);
    if (parts.length >= 4) {
      width = Math.max(Math.round(parts[2] || 800), 100);
      height = Math.max(Math.round(parts[3] || 600), 100);
    }
  }

  // 3. Strip existing width/height (often "100%" from mermaid)
  s = s.replace(/(<svg[^>]*?)\swidth="[^"]*"/i, "$1");
  s = s.replace(/(<svg[^>]*?)\sheight="[^"]*"/i, "$1");

  // 4. Inject explicit numeric width/height
  s = s.replace(
    /<svg(\s)/i,
    `<svg width="${width}" height="${height}"$1`,
  );

  // 5. Strip inline <style> blocks — these are the most common cause of
  //    the <img> refusing to load a Mermaid SVG. Sanitize already stripped
  //    classDef so we don't need the styles anyway; default browser
  //    rendering of plain rects + text is fine.
  s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  return { svg: s, width, height };
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

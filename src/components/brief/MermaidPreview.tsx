"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeMermaidForRender } from "@/lib/clientExport";

let initialized = false;
let cachedMermaid: typeof import("mermaid").default | null = null;

async function getMermaid() {
  if (cachedMermaid) return cachedMermaid;
  const mod = await import("mermaid");
  cachedMermaid = mod.default;
  if (!initialized) {
    cachedMermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "strict",
      flowchart: { htmlLabels: false, curve: "basis" },
    });
    initialized = true;
  }
  return cachedMermaid;
}

// Convert an in-DOM SVG element to a PNG data URL. Runs entirely in the
// browser where Mermaid's fonts already paint correctly (unlike the
// server-side resvg pipeline). Uses a base64-encoded data URL — same-origin
// so the canvas does NOT get tainted.
async function svgElementToPngDataUrl(
  svg: SVGSVGElement,
  scale = 2,
): Promise<string> {
  // 1. Make sure the SVG has explicit width/height attributes so the
  //    <img> loader knows how big to render it.
  const bbox = svg.getBoundingClientRect();
  const w = Math.max(1, Math.ceil(bbox.width));
  const h = Math.max(1, Math.ceil(bbox.height));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  // White background so PNGs don't have a transparent (and in dark viewers,
  // invisible) backdrop.
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(w));
  bg.setAttribute("height", String(h));
  bg.setAttribute("fill", "#ffffff");
  clone.insertBefore(bg, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  // Base64-encode → data URL. Use unescape/encodeURIComponent trick to handle
  // any unicode characters Mermaid emits.
  const b64 = btoa(unescape(encodeURIComponent(xml)));
  const dataUrl = `data:image/svg+xml;base64,${b64}`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error(`img load failed: ${String(e)}`));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function MermaidPreview({
  source,
  downloadName = "flowchart",
}: {
  source: string;
  /** Filename stem for the Download button (no extension). */
  downloadName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const renderId = useRef(`m${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    let cancelled = false;

    if (!source.trim()) {
      if (ref.current) ref.current.innerHTML = "";
      setError(null);
      setReady(false);
      return;
    }

    (async () => {
      try {
        const mermaid = await getMermaid();
        const id = `${renderId.current}-${Date.now()}`;
        const sanitized = sanitizeMermaidForRender(source);
        const { svg } = await mermaid.render(id, sanitized);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to render flowchart",
          );
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  const handleDownloadPng = useCallback(async () => {
    if (!ref.current) return;
    const svg = ref.current.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      const dataUrl = await svgElementToPngDataUrl(svg as SVGSVGElement, 2);
      downloadDataUrl(dataUrl, `${downloadName}.png`);
    } catch (e) {
      // PNG path failed (rare — e.g. SVG references external font that taints
      // the canvas). Fall back to the raw SVG, which is just as useful: opens
      // in any browser, drops into Slides / Docs, converts via any online tool.
      console.warn("[flowchart] PNG export failed, falling back to SVG:", e);
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      downloadDataUrl(url, `${downloadName}.svg`);
      // Clean the object URL after the click has been processed.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
    }
  }, [downloadName]);

  if (!source.trim()) {
    return (
      <div className="rounded-card border border-dashed border-black/[0.08] bg-surface-alt/70 px-4 py-10 text-center text-[12px] text-ink-soft/70">
        Type steps above to preview the flowchart.
      </div>
    );
  }

  return (
    <div className="rounded-card bg-surface-alt/70 p-4 shadow-hairline">
      {error ? (
        <p className="text-xs text-red-600">Flowchart error: {error}</p>
      ) : (
        <>
          <div ref={ref} className="flex justify-center [&_svg]:max-w-full" />
          {ready && (
            <div className="mt-4 flex justify-end border-t border-ink-on-page/10 pt-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-glow-primary transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span aria-hidden className="text-[14px] leading-none">⤓</span>
                <span>
                  {busy ? "Preparing…" : "Download flowchart (PNG)"}
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

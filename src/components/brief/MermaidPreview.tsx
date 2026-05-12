"use client";

import { useEffect, useRef, useState } from "react";
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

export function MermaidPreview({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const renderId = useRef(`m${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    let cancelled = false;

    if (!source.trim()) {
      if (ref.current) ref.current.innerHTML = "";
      setError(null);
      return;
    }

    (async () => {
      try {
        const mermaid = await getMermaid();
        // mermaid.render needs a unique id each call to avoid duplicate-id collisions
        const id = `${renderId.current}-${Date.now()}`;
        // Sanitize the same way the export pipeline does so the live
        // preview matches the PDF output exactly.
        const sanitized = sanitizeMermaidForRender(source);
        const { svg } = await mermaid.render(id, sanitized);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to render flowchart",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

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
        <div ref={ref} className="flex justify-center [&_svg]:max-w-full" />
      )}
    </div>
  );
}

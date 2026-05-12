import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resvg } from "@resvg/resvg-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMissingRequiredFields } from "@/lib/briefSchema";
import { parseBriefData, writeChangeLog } from "@/lib/briefData";
import { renderSectionsForExport } from "@/lib/exportSections";
import { BriefPdfDocument } from "@/lib/exportPdf";
import { uploadPdf } from "@/lib/storage";

// Render an SVG string to a PNG buffer using @resvg/resvg-js.
//
// Pre-processes the Mermaid SVG to remove features resvg can't handle:
//   - <style> blocks: resvg has limited CSS support, Mermaid's theme CSS
//     can crash the parser
//   - <foreignObject>: HTML inside SVG, only renders in real browsers
// Then inlines basic fill/stroke attributes so default colours look right.
// Falls back to a heuristic-only render if resvg throws.
function svgToPng(svg: string): { png: Buffer | null; reason?: string } {
  // 1. Strip features resvg chokes on
  const cleaned = svg
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<foreignObject[^>]*>[\s\S]*?<\/foreignObject>/gi, "");

  // 2. Inline default fills/strokes so plain shapes paint visibly when
  //    there's no CSS to colour them. This is a string-level pass — fast
  //    and doesn't need a DOM. Order matters: only inject when no
  //    fill/stroke is already present on the element.
  const inlined = cleaned
    .replace(/<rect\b(?![^>]*\bfill=)/gi, '<rect fill="#ffffff" stroke="#333333" stroke-width="1.2"')
    .replace(/<polygon\b(?![^>]*\bfill=)/gi, '<polygon fill="#ffffff" stroke="#333333" stroke-width="1.2"')
    .replace(/<circle\b(?![^>]*\bfill=)/gi, '<circle fill="#ffffff" stroke="#333333" stroke-width="1.2"')
    .replace(/<text\b(?![^>]*\bfill=)/gi, '<text fill="#111111" font-family="Arial, sans-serif" font-size="14"')
    .replace(/<tspan\b(?![^>]*\bfill=)/gi, '<tspan fill="#111111"');

  // 3. Render
  try {
    const resvg = new Resvg(inlined, {
      fitTo: { mode: "width", value: 1400 },
      background: "rgba(255,255,255,1)",
      font: {
        // Don't try to load system fonts — on Vercel's lambda there
        // usually aren't any usable ones. resvg-js ships its own default
        // font that handles the basic ASCII we need.
        loadSystemFonts: false,
        defaultFontFamily: "Arial",
      },
      logLevel: "warn",
    });
    const png = resvg.render().asPng();
    return { png: Buffer.from(png) };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[svgToPng] resvg render failed:", reason);
    console.error("[svgToPng] SVG (first 800 chars):", inlined.slice(0, 800));
    return { png: null, reason };
  }
}

// Force Node runtime — @react-pdf/renderer isn't Edge-compatible.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(s: string): string {
  return (
    s
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "untitled"
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: brief } = await supabase
    .from("briefs")
    .select(
      "id, status, data, created_by_id, pm_id, exported_pdf_url, exported_flowchart_url",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!brief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profileIds = [brief.created_by_id, brief.pm_id].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", profileIds);
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.name as string]),
  );

  const data = parseBriefData(brief.data);

  const missing = getMissingRequiredFields(data);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Brief is incomplete",
        missing: missing.map((m) => ({
          section: m.section,
          name: m.name,
          label: m.label,
          activityIndex: m.activityIndex,
        })),
      },
      { status: 400 },
    );
  }

  // Multi-activity flowchart upload. Client sends SVG text under
  // "flowchart_svg_<idx>" fields; server rasterizes via resvg.
  const activityFlowcharts: Record<number, Buffer> = {};
  const flowchartErrors: Array<{ idx: number; reason: string; svgChars: number }> = [];
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const entries = Array.from(form.entries());
    for (const [key, value] of entries) {
      const svgMatch = key.match(/^flowchart_svg_(\d+)$/);
      if (svgMatch) {
        const idx = Number(svgMatch[1]);
        const svgString = typeof value === "string" ? value : "";
        if (svgString.length > 0) {
          console.log(
            `[export] flowchart_svg_${idx} received (${svgString.length} chars), rasterising…`,
          );
          const { png, reason } = svgToPng(svgString);
          if (png) {
            activityFlowcharts[idx] = png;
            console.log(
              `[export] flowchart_svg_${idx} → PNG ${png.length} bytes`,
            );
          } else {
            flowchartErrors.push({
              idx,
              reason: reason ?? "unknown",
              svgChars: svgString.length,
            });
          }
        }
        continue;
      }
      const pngMatch = key.match(/^flowchart_(\d+)$/);
      if (pngMatch && value instanceof Blob && value.size > 0) {
        const idx = Number(pngMatch[1]);
        activityFlowcharts[idx] = Buffer.from(await value.arrayBuffer());
      }
    }
  }

  const csName =
    nameById.get(brief.created_by_id as string) || user.email || "—";
  const pmName = brief.pm_id
    ? (nameById.get(brief.pm_id as string) ?? "—")
    : "—";
  const projectName = data.projectName || "Untitled brief";
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const sections = renderSectionsForExport(data, { csName, pmName });
  const pdfBuffer = await renderToBuffer(
    BriefPdfDocument({
      projectName,
      clientName: data.clientName ?? "",
      csName,
      pmName,
      generatedDate,
      sections,
      activityFlowcharts,
    }) as React.ReactElement,
  );

  // Upload the PDF to Supabase Storage. Bucket is private — every download
  // goes through GET /api/briefs/[id]/pdf which auth-checks first.
  // Vercel's filesystem is read-only at runtime, so external storage is
  // mandatory in prod.
  const safeProject = safeFilename(projectName);
  const dateSlug = todayIso();
  const pdfName = `4Brains_Brief_${safeProject}_${dateSlug}.pdf`;

  try {
    await uploadPdf(brief.id as string, pdfName, pdfBuffer);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Storage upload failed: ${
          err instanceof Error ? err.message : "unknown"
        }`,
      },
      { status: 500 },
    );
  }

  // The exported_pdf_url column now stores the proxy path our /api/briefs/[id]/pdf
  // route reads. We also store the storage path inside it (after a # marker)
  // so the proxy knows what to fetch from Storage. Keeps the schema simple
  // (no new column needed for this v1).
  const downloadUrl = `/api/briefs/${brief.id}/pdf`;

  // Persist PDF URL + flip status to FINAL on every export.
  // Resilient fallback: if the brief_status enum hasn't been migrated to
  // include 'FINAL' (see supabase/migrations/2026-05-08_brief_status_final.sql),
  // we still save the URL so the user gets their download.
  const { error: updateErr } = await supabase
    .from("briefs")
    .update({
      status: "FINAL",
      exported_pdf_url: downloadUrl,
      exported_flowchart_url: null,
    })
    .eq("id", brief.id as string);

  if (updateErr) {
    console.warn(
      "Status update failed (enum not migrated yet?), saving URL only:",
      updateErr.message,
    );
    const { error: fallbackErr } = await supabase
      .from("briefs")
      .update({
        exported_pdf_url: downloadUrl,
        exported_flowchart_url: null,
      })
      .eq("id", brief.id as string);
    if (fallbackErr) {
      return NextResponse.json(
        {
          error: `Uploaded PDF but failed to update brief: ${fallbackErr.message}`,
        },
        { status: 500 },
      );
    }
  }

  await writeChangeLog({
    briefId: brief.id as string,
    userId: user.id,
    message: "Exported brief PDF",
  });

  return NextResponse.json({
    pdfUrl: downloadUrl,
    pdfName,
    flowchartCount: Object.keys(activityFlowcharts).length,
    flowchartErrors,
  });
}

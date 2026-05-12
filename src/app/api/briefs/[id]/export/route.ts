import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resvg } from "@resvg/resvg-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMissingRequiredFields } from "@/lib/briefSchema";
import { parseBriefData, writeChangeLog } from "@/lib/briefData";
import { renderSectionsForExport } from "@/lib/exportSections";
import { BriefPdfDocument } from "@/lib/exportPdf";
import { uploadPdf } from "@/lib/storage";

// Bundled font for resvg. Copied to /public/fonts at build time —
// Vercel reliably includes /public in the lambda bundle, while the
// outputFileTracingIncludes approach for node_modules paths was flaky
// in practice. Fonts live in git so deployment is deterministic.
async function getFontFilePaths(): Promise<string[]> {
  const root = process.cwd();
  const paths = [
    path.join(root, "public", "fonts", "Inter-Regular.woff2"),
    path.join(root, "public", "fonts", "Inter-Bold.woff2"),
  ];
  const usable: string[] = [];
  for (const p of paths) {
    try {
      await fs.access(p);
      usable.push(p);
    } catch (err) {
      console.warn(`[font] not found: ${p}`, err);
    }
  }
  console.log(
    `[font] loaded ${usable.length}/${paths.length} font files for resvg`,
  );
  return usable;
}

// Render an SVG string to a PNG buffer using @resvg/resvg-js.
//
// Pre-processes the Mermaid SVG to remove features resvg can't handle
// (<style>, <foreignObject>), then inlines basic fill/stroke attributes
// so default colours look right.
async function svgToPng(
  svg: string,
): Promise<{ png: Buffer | null; reason?: string }> {
  // 1. Strip features resvg chokes on
  const cleaned = svg
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<foreignObject[^>]*>[\s\S]*?<\/foreignObject>/gi, "");

  // 2. Pass 1: scope-aware fix for elements inside <marker>...
  //    Marker arrows must be SOLID-filled triangles (the default <path>
  //    fill="black" works, but we make it explicit for safety). Doing
  //    this FIRST so the catch-all `<path>` pass below doesn't overwrite
  //    them — the (?![^>]*\bfill=) lookahead skips already-filled tags.
  let inlined = cleaned.replace(
    /<marker\b[^>]*>([\s\S]*?)<\/marker>/gi,
    (full, inner: string) => {
      const fixedInner = inner
        .replace(
          /<path\b(?![^>]*\bfill=)/gi,
          '<path fill="#333333" stroke="#333333"',
        )
        .replace(
          /<polygon\b(?![^>]*\bfill=)/gi,
          '<polygon fill="#333333" stroke="#333333"',
        );
      return full.replace(inner, fixedInner);
    },
  );

  // 3. Pass 2: catch-all defaults for the rest of the SVG.
  //    Edge paths get fill="none" + stroke="#333" — without this, SVG's
  //    default <path> fill is BLACK, which paints the curve regions
  //    solid (the "tear-drop blobs" we saw before).
  //    Node shapes get white fill + dark border.
  //    Text gets dark fill + a font-family the bundled font can match.
  inlined = inlined
    .replace(
      /<path\b(?![^>]*\bfill=)/gi,
      '<path fill="none" stroke="#333333" stroke-width="1.5"',
    )
    .replace(
      /<rect\b(?![^>]*\bfill=)/gi,
      '<rect fill="#ffffff" stroke="#333333" stroke-width="1.2"',
    )
    .replace(
      /<polygon\b(?![^>]*\bfill=)/gi,
      '<polygon fill="#ffffff" stroke="#333333" stroke-width="1.2"',
    )
    .replace(
      /<circle\b(?![^>]*\bfill=)/gi,
      '<circle fill="#ffffff" stroke="#333333" stroke-width="1.2"',
    )
    .replace(
      /<text\b(?![^>]*\bfill=)/gi,
      '<text fill="#111111" font-family="Inter, sans-serif" font-size="14"',
    )
    .replace(/<tspan\b(?![^>]*\bfill=)/gi, '<tspan fill="#111111"');

  // 4. Render with the bundled Inter font files. Eliminates all
  //    dependency on the runtime's system fonts (which were nondeterministic
  //    across Vercel cold starts and local dev). The font is shipped via
  //    @fontsource/inter and force-included in the lambda bundle by
  //    next.config.mjs's outputFileTracingIncludes.
  try {
    const fontFiles = await getFontFilePaths();
    const resvg = new Resvg(inlined, {
      fitTo: { mode: "width", value: 1400 },
      background: "rgba(255,255,255,1)",
      font: {
        fontFiles: fontFiles.length > 0 ? fontFiles : undefined,
        // Belt-and-suspenders: also try system fonts if the bundled files
        // somehow weren't included in the deployment.
        loadSystemFonts: fontFiles.length === 0,
        defaultFontFamily: "Inter",
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

  // Flowchart embedding in the PDF is OFF by default for the pilot.
  // The Mermaid→SVG→server-rasterize→PNG→embed pipeline has too many
  // edge cases to ship reliably right now. Users still see the flowchart
  // live in the app's Edit form preview; PDF carries the rest.
  //
  // To re-enable later (once resvg rendering is solid), set
  // FLOWCHARTS_IN_PDF=true in the Vercel env.
  const FLOWCHARTS_IN_PDF = process.env.FLOWCHARTS_IN_PDF === "true";
  const activityFlowcharts: Record<number, Buffer> = {};
  const flowchartErrors: Array<{ idx: number; reason: string; svgChars: number }> = [];

  if (FLOWCHARTS_IN_PDF) {
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
            const { png, reason } = await svgToPng(svgString);
            if (png) {
              activityFlowcharts[idx] = png;
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
      }
    }
  } else {
    // Still consume the body so the request completes cleanly.
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.startsWith("multipart/form-data")) {
      await req.formData();
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

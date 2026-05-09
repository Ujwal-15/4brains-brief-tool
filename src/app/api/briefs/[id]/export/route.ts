import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMissingRequiredFields } from "@/lib/briefSchema";
import { parseBriefData, writeChangeLog } from "@/lib/briefData";
import { renderSectionsForExport } from "@/lib/exportSections";
import { BriefPdfDocument } from "@/lib/exportPdf";
import { uploadPdf } from "@/lib/storage";

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

  // Multi-activity flowchart upload: form fields named "flowchart_<idx>"
  // where <idx> is 1-based.
  const activityFlowcharts: Record<number, Buffer> = {};
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const entries = Array.from(form.entries());
    for (const [key, value] of entries) {
      const m = key.match(/^flowchart_(\d+)$/);
      if (!m) continue;
      const idx = Number(m[1]);
      if (value instanceof Blob && value.size > 0) {
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
  });
}

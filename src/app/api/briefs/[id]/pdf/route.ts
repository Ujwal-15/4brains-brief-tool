import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { downloadPdf } from "@/lib/storage";

// Auth-checked proxy that streams a brief's exported PDF from Supabase
// Storage to the requesting user's browser.
//
// Why a proxy instead of a direct Storage URL?
//   - Bucket is private. Direct Storage URLs require service-role auth,
//     which we never expose to the browser.
//   - Going through this route gives us:
//       (a) Auth check — only signed-in @4brains.in users can download.
//       (b) RLS-safe — Supabase RLS gates SELECT on the briefs row, so
//           if a user can't see the brief, they can't get its PDF.
//       (c) Clean download semantics — server sets Content-Disposition,
//           browser names the file correctly.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PDFs live at <briefId>/<filename>.pdf in the bucket. We list the folder
// to find the latest filename (re-exports overwrite, so there's typically
// exactly one). This avoids needing an extra DB column to remember the
// exact filename.
async function findLatestPdfPath(briefId: string): Promise<string | null> {
  // Re-uses the admin client via the storage lib path discovery — listing
  // doesn't need to be on the user-scoped client because this route already
  // gated on whether the user can SELECT the brief row above.
  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const supa = getSupabaseAdminClient();
  const { data, error } = await supa.storage.from("briefs").list(briefId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error || !data || data.length === 0) return null;
  // Filter to .pdf and pick the newest.
  const pdfs = data.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
  if (pdfs.length === 0) return null;
  return `${briefId}/${pdfs[0].name}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  // Auth: must be signed in.
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Brief access: RLS gates SELECT, so a user who shouldn't see this brief
  // gets a `null` row here and we return 404.
  const { data: brief } = await supabase
    .from("briefs")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();
  if (!brief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resolve the latest uploaded PDF for this brief.
  const path = await findLatestPdfPath(params.id);
  if (!path) {
    return NextResponse.json(
      { error: "No PDF exported yet for this brief" },
      { status: 404 },
    );
  }

  const result = await downloadPdf(path);
  if (!result) {
    return NextResponse.json(
      { error: "PDF missing from storage" },
      { status: 404 },
    );
  }

  const filename = path.split("/").pop() || "brief.pdf";
  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.buffer.length),
      // Inline so browsers can preview, but still allow download via the
      // anchor's `download` attribute on our buttons.
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}

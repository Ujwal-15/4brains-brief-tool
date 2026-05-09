import "server-only";
import { getSupabaseAdminClient } from "./supabase/admin";

// Thin wrapper over Supabase Storage for the brief PDF artifact.
//
// Bucket layout:
//   briefs/<briefId>/<filename>.pdf
//
// Bucket is PRIVATE — downloads go through /api/briefs/[id]/pdf which
// authenticates the user before streaming. The bucket itself never sees
// public traffic.

const BUCKET = "briefs";

// Object path inside the bucket. We use the brief's UUID as the folder so
// each brief has its own namespace (re-exports overwrite their previous
// version, no orphans).
function objectPath(briefId: string, filename: string): string {
  return `${briefId}/${filename}`;
}

// Upload a PDF buffer. `upsert: true` so a re-export overwrites the
// previous file at the same path — no duplicates accumulate per brief.
// Returns the storage path (NOT a URL) which we save in the briefs row.
export async function uploadPdf(
  briefId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const supa = getSupabaseAdminClient();
  const path = objectPath(briefId, filename);
  const { error } = await supa.storage.from(BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return path;
}

// Download a PDF buffer for the proxy route.
// Returns null when the object is missing (e.g. bucket cleared in dashboard).
export async function downloadPdf(
  storagePath: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const supa = getSupabaseAdminClient();
  const { data, error } = await supa.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    if (error?.message?.toLowerCase().includes("not found")) return null;
    throw new Error(`Storage download failed: ${error?.message ?? "unknown"}`);
  }
  const arrayBuffer = await data.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: data.type || "application/pdf",
  };
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { changeLogMessageForStatus, writeChangeLog } from "@/lib/briefData";

const ALLOWED_STATUSES = ["DRAFT", "FINAL", "ARCHIVED"] as const;

export async function PATCH(
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

  // RLS enforces that the caller can only see/update briefs they own,
  // are PM on, or all of them if they're admin. A miss here means either
  // truly not found OR forbidden — we return 404 in both cases so we
  // don't leak existence to non-owners.
  const { data: existing } = await supabase
    .from("briefs")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // PM is now stored as a free-text name inside data jsonb (data.pmName), so
  // no separate pmId field is accepted here.
  const body = (await req.json()) as {
    data?: unknown;
    status?: unknown;
  };

  const update: Record<string, unknown> = {};

  if (body.data !== undefined) {
    if (typeof body.data !== "string") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    try {
      update.data = JSON.parse(body.data);
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }
  }

  let nextStatus: string | undefined;
  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
    nextStatus = body.status;
  }

  const { data: brief, error } = await supabase
    .from("briefs")
    .update(update)
    .eq("id", params.id)
    .select("id, status, updated_at")
    .single();

  if (error || !brief) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update brief" },
      { status: 500 },
    );
  }

  // Only log when the user explicitly transitioned status — auto-saves
  // come through with `data` only and shouldn't pollute the audit trail.
  if (nextStatus) {
    await writeChangeLog({
      briefId: brief.id as string,
      userId: user.id,
      message: changeLogMessageForStatus(nextStatus),
    });
  }

  return NextResponse.json({
    id: brief.id,
    status: brief.status,
    updatedAt: brief.updated_at,
  });
}

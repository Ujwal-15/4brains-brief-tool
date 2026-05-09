import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeChangeLog } from "@/lib/briefData";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { data?: unknown };
  if (typeof body.data !== "string") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Validate that the client sent a parseable JSON payload, then store the
  // parsed object — the column is jsonb, not text.
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.data);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const { data: brief, error } = await supabase
    .from("briefs")
    .insert({
      status: "DRAFT",
      created_by_id: user.id,
      data: parsed as object,
    })
    .select("id, status, updated_at")
    .single();

  if (error || !brief) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create brief" },
      { status: 500 },
    );
  }

  await writeChangeLog({
    briefId: brief.id as string,
    userId: user.id,
    message: "Created brief",
  });

  return NextResponse.json({
    id: brief.id,
    status: brief.status,
    updatedAt: brief.updated_at,
  });
}

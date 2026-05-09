import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type SuggestInput, suggestUserJourney } from "@/lib/llm/suggest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI suggestions are not configured on this server." },
      { status: 503 },
    );
  }

  let body: Partial<SuggestInput>;
  try {
    body = (await req.json()) as Partial<SuggestInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.productId !== "string" || !body.productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 },
    );
  }

  const cleanString = (v: unknown): string | undefined =>
    typeof v === "string" ? v : undefined;
  const cleanArray = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : undefined;

  try {
    const result = await suggestUserJourney({
      productId: body.productId,
      customProductName: cleanString(body.customProductName),
      customLabel: cleanString(body.customLabel),
      description: cleanString(body.description),
      communicationFlows: cleanArray(body.communicationFlows),
      userDataCaptured: typeof body.userDataCaptured === "boolean" ? body.userDataCaptured : undefined,
      dataFields: cleanString(body.dataFields),
      dataSharedBack: cleanString(body.dataSharedBack),
      clientProvidesData: typeof body.clientProvidesData === "boolean" ? body.clientProvidesData : undefined,
      dataFormat: cleanString(body.dataFormat),
      dataNotes: cleanString(body.dataNotes),
      fourBrainsDeliverables: cleanArray(body.fourBrainsDeliverables),
      clientDeliverables: cleanArray(body.clientDeliverables),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("LLM suggest failed", err);
    const message =
      err instanceof Error ? err.message : "Suggestion generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

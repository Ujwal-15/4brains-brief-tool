import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BriefForm } from "@/components/brief/BriefForm";
import { parseBriefData } from "@/lib/briefData";

type BriefRow = {
  id: string;
  data: unknown;
  created_by_id: string;
  pm_id: string | null;
};

export default async function EditBriefPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Flat team — anyone signed in can edit any brief. Whitelist sits
  // upstream at the sign-in layer.
  const { data: rawBrief } = await supabase
    .from("briefs")
    .select("id, data, created_by_id, pm_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!rawBrief) notFound();
  const brief = rawBrief as BriefRow;

  return (
    <BriefForm
      briefId={brief.id}
      initialData={parseBriefData(brief.data)}
    />
  );
}

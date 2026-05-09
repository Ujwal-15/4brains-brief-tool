import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/Dashboard";
import { Banner } from "@/components/Banner";
import {
  type BriefRow,
  type BriefStatus,
  formatBriefDate,
  parseBriefData,
} from "@/lib/briefs";

type BriefRowFromDb = {
  id: string;
  status: string;
  data: unknown;
  updated_at: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams?: { saved?: string; exported?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS handles "owner OR pm OR admin" — no explicit filter needed.
  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, status, data, updated_at")
    .order("updated_at", { ascending: false });

  const rows: BriefRow[] = ((briefs as BriefRowFromDb[] | null) ?? []).map(
    (b) => {
      const updatedAt = new Date(b.updated_at);
      const { projectName, clientName, activityCount } = parseBriefData(b.data);
      return {
        id: b.id,
        status: b.status as BriefStatus,
        projectName,
        clientName,
        activityCount,
        updatedAtLabel: formatBriefDate(updatedAt),
        updatedAtISO: updatedAt.toISOString(),
      };
    },
  );

  return (
    <>
      {searchParams?.exported === "1" && (
        <Banner kind="success">
          Export complete — the PDF is downloading and is also linked from
          the brief detail page. Flowcharts are embedded inside.
        </Banner>
      )}
      {searchParams?.saved === "1" && <Banner kind="success">Draft saved.</Banner>}
      <Dashboard briefs={rows} />
    </>
  );
}

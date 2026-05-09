import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BriefDetail } from "@/components/brief/BriefDetail";
import { parseBriefData } from "@/lib/briefData";
import { formatBriefDate } from "@/lib/briefs";
import { renderSectionsForExport } from "@/lib/exportSections";
import { Banner } from "@/components/Banner";
import type { BriefSummary } from "@/components/brief/BriefDetail";

const DATE_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatIsoDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return SHORT_DATE_FMT.format(d);
}

function formatRange(from: string, to: string): string {
  const f = formatIsoDate(from);
  const t = formatIsoDate(to);
  if (f && t && f !== t) return `${f} – ${t}`;
  return f || t || "";
}

type BriefRow = {
  id: string;
  status: string;
  data: unknown;
  created_by_id: string;
  pm_id: string | null;
  exported_pdf_url: string | null;
  exported_flowchart_url: string | null;
  updated_at: string;
};

type ProfileRow = { id: string; name: string };

type ChangeLogRow = {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
};

export default async function BriefDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS gates SELECT. Missing → 404 (covers both not-found and forbidden).
  const { data: rawBrief } = await supabase
    .from("briefs")
    .select(
      "id, status, data, created_by_id, pm_id, exported_pdf_url, exported_flowchart_url, updated_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!rawBrief) notFound();
  const brief = rawBrief as BriefRow;

  // Resolve creator + PM names (profiles read freely under our RLS).
  const profileIds = [brief.created_by_id, brief.pm_id].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", profileIds);
  const nameById = new Map(
    ((profiles as ProfileRow[]) ?? []).map((p) => [p.id, p.name]),
  );

  // Last 10 change log entries + names of the users who made them.
  const { data: rawLogs } = await supabase
    .from("change_logs")
    .select("id, message, created_at, user_id")
    .eq("brief_id", brief.id)
    .order("created_at", { ascending: false })
    .limit(10);
  const logs = (rawLogs as ChangeLogRow[]) ?? [];

  const logUserIds = Array.from(new Set(logs.map((l) => l.user_id)));
  const { data: logProfilesRaw } = logUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, name")
        .in("id", logUserIds)
    : { data: [] };
  const logUserNameById = new Map(
    ((logProfilesRaw as ProfileRow[]) ?? []).map((p) => [p.id, p.name]),
  );

  const data = parseBriefData(brief.data);
  const csName = nameById.get(brief.created_by_id) || "";
  const pmName = brief.pm_id ? (nameById.get(brief.pm_id) ?? null) : null;

  const sections = renderSectionsForExport(data, {
    csName,
    pmName: pmName ?? "—",
  });

  const summary: BriefSummary = {
    eventDate: formatRange(data.eventDateFrom, data.eventDateTo),
    cities: data.cities ?? "",
    venue: data.venueAddress ?? "",
    activitiesCount: (data.activities ?? []).filter(
      (a) => typeof a?.productId === "string" && a.productId.trim().length > 0,
    ).length,
    setupDate: formatRange(data.setupDateFrom, data.setupDateTo),
    indoorOutdoor: data.indoorOutdoor ?? "",
  };

  // Flat team — anyone signed in can edit any brief. Access is gated
  // upstream by the sign-in whitelist (mailer list).
  const canEdit = true;

  return (
    <>
      {searchParams?.saved === "1" && <Banner kind="success">Saved.</Banner>}
      <BriefDetail
        briefId={brief.id}
        projectName={data.projectName || "Untitled brief"}
        clientName={data.clientName || "—"}
        createdByName={csName || "—"}
        pmName={pmName}
        updatedAtLabel={formatBriefDate(new Date(brief.updated_at))}
        exportedPdfUrl={brief.exported_pdf_url}
        exportedFlowchartUrl={brief.exported_flowchart_url}
        sections={sections}
        summary={summary}
        canEdit={canEdit}
        changeLog={logs.map((c) => ({
          id: c.id,
          message: c.message,
          createdAt: DATE_TIME_FMT.format(new Date(c.created_at)),
          user: {
            name: logUserNameById.get(c.user_id) ?? "Unknown user",
            email: "",
          },
        }))}
      />
    </>
  );
}

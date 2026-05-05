import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BriefDetail } from "@/components/brief/BriefDetail";
import { parseBriefData } from "@/lib/briefData";
import {
  type BriefStatus,
  formatBriefDate,
} from "@/lib/briefs";
import { renderSectionsForExport } from "@/lib/exportSections";
import { Banner } from "@/components/Banner";

const DATE_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function BriefDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      pm: { select: { id: true, name: true, email: true } },
      changeLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!brief) notFound();

  const isOwner =
    brief.createdById === session.user.id ||
    brief.pmId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound(); // 404 rather than 403 to not leak existence

  const data = parseBriefData(brief.data);
  const ctx = {
    csName: brief.createdBy?.name || "",
    pmName: brief.pm?.name || "—",
  };
  const sections = renderSectionsForExport(data, ctx);

  const canEdit =
    brief.createdById === session.user.id || session.user.role === "ADMIN";

  return (
    <>
      {searchParams?.saved === "1" && (
        <Banner kind="success">Saved.</Banner>
      )}
      <BriefDetail
        briefId={brief.id}
        status={brief.status as BriefStatus}
        projectName={data.projectName || "Untitled brief"}
        clientName={data.clientName || "—"}
        createdByName={brief.createdBy?.name || "—"}
        pmName={brief.pm?.name ?? null}
        updatedAtLabel={formatBriefDate(brief.updatedAt)}
        exportedPdfUrl={brief.exportedPdfUrl}
        exportedFlowchartUrl={brief.exportedFlowchartUrl}
        sections={sections}
        canEdit={canEdit}
        changeLog={brief.changeLogs.map((c) => ({
          id: c.id,
          message: c.message,
          createdAt: DATE_TIME_FMT.format(c.createdAt),
          user: {
            name: c.user.name,
            email: c.user.email,
          },
        }))}
      />
    </>
  );
}

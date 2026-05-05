import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/Dashboard";
import { Banner } from "@/components/Banner";
import {
  type BriefRow,
  type BriefStatus,
  formatBriefDate,
  parseBriefData,
} from "@/lib/briefs";

export default async function Home({
  searchParams,
}: {
  searchParams?: { sent?: string; saved?: string; exported?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const briefs = await prisma.brief.findMany({
    where: {
      OR: [{ createdById: userId }, { pmId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      data: true,
      updatedAt: true,
    },
  });

  const rows: BriefRow[] = briefs.map((b) => {
    const { projectName, clientName } = parseBriefData(b.data);
    return {
      id: b.id,
      status: b.status as BriefStatus,
      projectName,
      clientName,
      updatedAtLabel: formatBriefDate(b.updatedAt),
      updatedAtISO: b.updatedAt.toISOString(),
    };
  });

  return (
    <>
      {searchParams?.sent === "1" && (
        <Banner kind="success">
          Brief sent to PM for review. Email notification is not wired up yet —
          let the PM know directly for now.
        </Banner>
      )}
      {searchParams?.exported === "1" && (
        <Banner kind="success">
          Export complete. The ZIP started downloading; PDF and flowchart are
          also linked from the brief detail page.
        </Banner>
      )}
      {searchParams?.saved === "1" && <Banner kind="success">Draft saved.</Banner>}
      <Dashboard briefs={rows} />
    </>
  );
}

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BriefForm } from "@/components/brief/BriefForm";
import { parseBriefData } from "@/lib/briefData";

export default async function EditBriefPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    select: { id: true, data: true, createdById: true, pmId: true },
  });
  if (!brief) notFound();

  const isOwner = brief.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const pms = await prisma.user.findMany({
    where: { role: "PM" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <BriefForm
      pmOptions={pms}
      briefId={brief.id}
      initialData={parseBriefData(brief.data)}
    />
  );
}

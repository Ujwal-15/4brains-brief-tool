import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BriefForm } from "@/components/brief/BriefForm";

export default async function NewBriefPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const pms = await prisma.user.findMany({
    where: { role: "PM" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return <BriefForm pmOptions={pms} />;
}

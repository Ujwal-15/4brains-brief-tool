import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeChangeLog } from "@/lib/briefData";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { data?: unknown };
  if (typeof body.data !== "string") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    JSON.parse(body.data);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const brief = await prisma.brief.create({
    data: {
      status: "DRAFT",
      createdById: session.user.id,
      data: body.data,
    },
    select: { id: true, status: true, updatedAt: true },
  });

  await writeChangeLog({
    briefId: brief.id,
    userId: session.user.id,
    message: "Created brief",
  });

  return NextResponse.json(brief);
}

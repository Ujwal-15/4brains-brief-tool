import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeLogMessageForStatus, writeChangeLog } from "@/lib/briefData";

const ALLOWED_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.brief.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, createdById: true, pmId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner =
    existing.createdById === session.user.id ||
    existing.pmId === session.user.id;
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    data?: unknown;
    status?: unknown;
    pmId?: unknown;
  };

  const update: Record<string, unknown> = {};

  if (body.data !== undefined) {
    if (typeof body.data !== "string") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    try {
      JSON.parse(body.data);
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }
    update.data = body.data;
  }

  let nextStatus: string | undefined;
  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !ALLOWED_STATUSES.includes(body.status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
    nextStatus = body.status;
  }

  if (body.pmId !== undefined) {
    if (body.pmId !== null && typeof body.pmId !== "string") {
      return NextResponse.json({ error: "Invalid pmId" }, { status: 400 });
    }
    update.pmId = body.pmId || null;
  }

  const brief = await prisma.brief.update({
    where: { id: params.id },
    data: update,
    select: { id: true, status: true, updatedAt: true },
  });

  // Only log when the user explicitly transitioned status — auto-saves come
  // through with `data` only and shouldn't pollute the audit trail.
  if (nextStatus) {
    await writeChangeLog({
      briefId: brief.id,
      userId: session.user.id,
      message: changeLogMessageForStatus(nextStatus),
    });
  }

  return NextResponse.json(brief);
}

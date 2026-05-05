import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMissingRequiredFields } from "@/lib/briefSchema";
import { parseBriefData, writeChangeLog } from "@/lib/briefData";
import { renderSectionsForExport } from "@/lib/exportSections";
import { BriefPdfDocument } from "@/lib/exportPdf";

// Force Node runtime — @react-pdf/renderer and node:fs aren't Edge-compatible.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(s: string): string {
  return (
    s
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "untitled"
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brief = await prisma.brief.findUnique({
    where: { id: params.id },
    include: {
      pm: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!brief) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner =
    brief.createdById === session.user.id ||
    brief.pmId === session.user.id;
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = parseBriefData(brief.data);

  // Validate before export — same rules as Send to PM.
  const missing = getMissingRequiredFields(data);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Brief is incomplete",
        missing: missing.map((m) => ({
          section: m.section,
          name: m.name,
          label: m.label,
        })),
      },
      { status: 400 },
    );
  }

  // Optional flowchart PNG attached as multipart form field "flowchart".
  let flowchartPng: Buffer | undefined;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("flowchart");
    if (file && file instanceof Blob && file.size > 0) {
      flowchartPng = Buffer.from(await file.arrayBuffer());
    }
  }

  const csName = brief.createdBy?.name || session.user.name || "—";
  const pmName = brief.pm?.name || "—";
  const projectName = data.projectName || "Untitled brief";
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Render PDF
  const sections = renderSectionsForExport(data, { csName, pmName });
  const pdfBuffer = await renderToBuffer(
    BriefPdfDocument({
      projectName,
      csName,
      generatedDate,
      sections,
      flowchartPng,
    }) as React.ReactElement,
  );

  // Write files. NOTE: writes to /public — works in local dev.
  // TODO(production): swap to S3/R2 (Vercel filesystem is read-only at runtime).
  const safeProject = safeFilename(projectName);
  const dateSlug = todayIso();
  const baseName = `4Brains_Brief_${safeProject}_${dateSlug}`;
  const flowchartName = "User_Journey_Flowchart.png";
  const zipName = `${baseName}.zip`;
  const pdfName = `${baseName}.pdf`;

  const exportsDir = path.join(
    process.cwd(),
    "public",
    "exports",
    brief.id,
  );
  await fs.mkdir(exportsDir, { recursive: true });
  await fs.writeFile(path.join(exportsDir, pdfName), pdfBuffer);
  if (flowchartPng) {
    await fs.writeFile(path.join(exportsDir, flowchartName), flowchartPng);
  }

  // Build ZIP
  const zip = new JSZip();
  zip.file(pdfName, pdfBuffer);
  if (flowchartPng) zip.file(flowchartName, flowchartPng);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  await fs.writeFile(path.join(exportsDir, zipName), zipBuffer);

  const pdfUrl = `/exports/${brief.id}/${pdfName}`;
  const flowchartUrl = flowchartPng
    ? `/exports/${brief.id}/${flowchartName}`
    : null;
  const zipUrl = `/exports/${brief.id}/${zipName}`;

  // Persist URLs + flip status to IN_REVIEW.
  await prisma.brief.update({
    where: { id: brief.id },
    data: {
      status: "IN_REVIEW",
      exportedPdfUrl: pdfUrl,
      exportedFlowchartUrl: flowchartUrl,
    },
  });

  await writeChangeLog({
    briefId: brief.id,
    userId: session.user.id,
    message: "Exported PDF and flowchart",
  });

  return NextResponse.json({
    pdfUrl,
    flowchartUrl,
    zipUrl,
    zipName,
  });
}

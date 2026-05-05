// Server-side helpers for working with brief records.

import { prisma } from "./prisma";
import { type BriefFormData, EMPTY_BRIEF } from "./briefSchema";

export function parseBriefData(raw: string): BriefFormData {
  try {
    const parsed = JSON.parse(raw) as Partial<BriefFormData>;
    return { ...EMPTY_BRIEF, ...parsed };
  } catch {
    return EMPTY_BRIEF;
  }
}

export function changeLogMessageForStatus(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Saved as draft";
    case "IN_REVIEW":
      return "Sent to PM for review";
    case "APPROVED":
      return "Approved";
    case "ARCHIVED":
      return "Archived";
    default:
      return `Status changed to ${status}`;
  }
}

// Best-effort change log writer. Failures are logged but never thrown — the
// audit trail is non-essential to the underlying mutation.
export async function writeChangeLog(input: {
  briefId: string;
  userId: string;
  message: string;
}): Promise<void> {
  try {
    await prisma.changeLog.create({
      data: {
        briefId: input.briefId,
        userId: input.userId,
        message: input.message,
      },
    });
  } catch (err) {
    console.error("Failed to write ChangeLog entry", err);
  }
}

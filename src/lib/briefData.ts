// Server-side helpers for working with brief records.

import { createSupabaseServerClient } from "./supabase/server";
import {
  type Activity,
  type BriefFormData,
  EMPTY_ACTIVITY,
  EMPTY_BRIEF,
} from "./briefSchema";

// Brief.data lives in a jsonb column post-Supabase. Older code paths still
// pass through stringified JSON, so accept both. Anything we can't parse
// becomes EMPTY_BRIEF — callers always get a fully-shaped object.
//
// Each activity inside `data.activities` is merged with EMPTY_ACTIVITY so
// arrays-and-booleans-and-strings always have safe defaults. (Without this,
// renderers downstream crash on `a.communicationFlows.length` when the
// activity object was saved before that field existed.)
export function parseBriefData(raw: unknown): BriefFormData {
  let parsed: Partial<BriefFormData> | null = null;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as Partial<BriefFormData>;
    } catch {
      return cloneEmpty();
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw as Partial<BriefFormData>;
  }

  if (!parsed) return cloneEmpty();

  const merged = { ...EMPTY_BRIEF, ...parsed } as BriefFormData;
  const activities = Array.isArray(parsed.activities) ? parsed.activities : [];
  merged.activities =
    activities.length > 0
      ? activities.map(normalizeActivity)
      : [{ ...EMPTY_ACTIVITY }];
  return merged;
}

function normalizeActivity(a: Partial<Activity>): Activity {
  return { ...EMPTY_ACTIVITY, ...a };
}

function cloneEmpty(): BriefFormData {
  return { ...EMPTY_BRIEF, activities: [{ ...EMPTY_ACTIVITY }] };
}

export function changeLogMessageForStatus(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Saved as draft";
    case "FINAL":
      return "Marked as final";
    case "ARCHIVED":
      return "Archived";
    default:
      return `Status changed to ${status}`;
  }
}

// Best-effort change log writer. Failures are logged but never thrown — the
// audit trail is non-essential to the underlying mutation.
//
// Uses the request-scoped Supabase server client; RLS enforces that
// user_id = auth.uid() and that the parent brief is readable to the caller.
export async function writeChangeLog(input: {
  briefId: string;
  userId: string;
  message: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("change_logs").insert({
      brief_id: input.briefId,
      user_id: input.userId,
      message: input.message,
    });
    if (error) {
      console.error("Failed to write ChangeLog entry", error);
    }
  } catch (err) {
    console.error("Failed to write ChangeLog entry", err);
  }
}

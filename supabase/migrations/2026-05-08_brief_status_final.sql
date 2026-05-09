-- Migrate brief_status enum from 4-state to flat 3-state.
--
-- Old: DRAFT | IN_REVIEW | APPROVED | ARCHIVED
-- New: DRAFT | FINAL | ARCHIVED
--
-- 'FINAL' is auto-set when any user clicks Export. There is no review /
-- approval workflow — the team is flat. Existing rows with 'IN_REVIEW'
-- or 'APPROVED' are remapped to 'FINAL' (they were exported, just under
-- the old labels).
--
-- We don't drop 'IN_REVIEW' / 'APPROVED' from the enum because Postgres
-- makes that surgery painful. Leaving them as legacy values is harmless;
-- the app no longer writes them.
--
-- Idempotent: safe to run multiple times.

ALTER TYPE brief_status ADD VALUE IF NOT EXISTS 'FINAL';

-- Re-mappings need a separate transaction from the ADD VALUE because
-- Postgres can't use a freshly-added enum value in the same transaction.
COMMIT;
BEGIN;

UPDATE briefs SET status = 'FINAL' WHERE status IN ('IN_REVIEW', 'APPROVED');

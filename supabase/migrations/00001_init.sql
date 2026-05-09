-- 4Brains Brief Tool — initial schema
-- Run once against a fresh Supabase project. Not idempotent on its own —
-- if you need to re-run, drop the public schema first.
--
-- What this creates:
--   • Two enums (user_role, brief_status)
--   • Three tables (profiles, briefs, change_logs)
--   • Triggers for updated_at and auto-profile-on-signup
--   • RLS enabled on all three tables with policies sketched below
--   • An is_admin() helper used by RLS policies
--
-- Security model:
--   • Authenticated users see only briefs they created or are PM on, unless
--     they're admin (per is_admin()).
--   • Briefs can only be inserted with created_by_id = auth.uid().
--   • change_logs are append-only — no UPDATE / DELETE grants.
--   • profiles are read-only from the client; writes happen via the
--     handle_new_user trigger or via service role.

-- =======================================================================
-- 1. ENUMS
-- =======================================================================
CREATE TYPE user_role AS ENUM ('CS_BD', 'PM', 'ADMIN');
CREATE TYPE brief_status AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');

-- =======================================================================
-- 2. TABLES
-- =======================================================================
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  role        user_role NOT NULL DEFAULT 'CS_BD',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.briefs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status                  brief_status NOT NULL DEFAULT 'DRAFT',
  created_by_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  pm_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  exported_pdf_url        text,
  exported_flowchart_url  text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX briefs_created_by_idx  ON public.briefs(created_by_id);
CREATE INDEX briefs_pm_idx          ON public.briefs(pm_id);
CREATE INDEX briefs_updated_at_idx  ON public.briefs(updated_at DESC);

CREATE TABLE public.change_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id    uuid NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX change_logs_brief_idx ON public.change_logs(brief_id, created_at DESC);

-- =======================================================================
-- 3. FUNCTIONS + TRIGGERS
-- =======================================================================

-- Bump updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER briefs_set_updated_at
BEFORE UPDATE ON public.briefs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is added.
-- The seed script (and Supabase dashboard's "Add user") can pass
-- raw_user_meta_data = { name, role } to set those on the profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CS_BD')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS helper: is the current authenticated user an admin?
-- SECURITY DEFINER lets it read profiles regardless of the caller's RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- =======================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =======================================================================
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

-- =======================================================================
-- 5. RLS POLICIES — profiles
-- =======================================================================
-- Authenticated users can read all profiles (needed for the PM dropdown).
-- Writes are not exposed; the handle_new_user trigger and service role
-- handle profile mutations.
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- =======================================================================
-- 6. RLS POLICIES — briefs
-- =======================================================================
CREATE POLICY briefs_select_owner_or_admin ON public.briefs
  FOR SELECT TO authenticated
  USING (
    created_by_id = auth.uid()
    OR pm_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY briefs_insert_self ON public.briefs
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid());

CREATE POLICY briefs_update_owner_or_admin ON public.briefs
  FOR UPDATE TO authenticated
  USING (
    created_by_id = auth.uid()
    OR pm_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    created_by_id = auth.uid()
    OR pm_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY briefs_delete_admin ON public.briefs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =======================================================================
-- 7. RLS POLICIES — change_logs (append-only audit trail)
-- =======================================================================
-- Visibility piggybacks on briefs RLS: a user can read a change log entry
-- iff they can read the parent brief.
CREATE POLICY change_logs_select_via_brief ON public.change_logs
  FOR SELECT TO authenticated
  USING (
    brief_id IN (SELECT id FROM public.briefs)
  );

-- Inserts must claim the inserting user as user_id, on a brief they can read.
CREATE POLICY change_logs_insert_self ON public.change_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND brief_id IN (SELECT id FROM public.briefs)
  );

-- No UPDATE / DELETE policies — change logs are immutable to non-admins.

-- =======================================================================
-- 8. GRANTS — explicit so RLS has something to filter
-- =======================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT USAGE ON TYPE public.user_role     TO authenticated;
GRANT USAGE ON TYPE public.brief_status  TO authenticated;

GRANT SELECT                          ON public.profiles    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.briefs      TO authenticated;
GRANT SELECT, INSERT                  ON public.change_logs TO authenticated;

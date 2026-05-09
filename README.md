# 4Brains Brief Tool

Internal web tool for the 4Brains Technologies CS/BD team to capture
structured project briefs, send them to PMs for review, and export a polished
PDF + auto-generated user-journey flowchart for the dev team.

## Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** — minimal black/white/gray with a single amber accent (`#D4811C`)
- **Supabase** — Postgres + Auth + (RLS for authorization)
  - `@supabase/ssr` for cookie-based auth in middleware/server components
  - `@supabase/supabase-js` for queries
- **React Hook Form** + **Zod** for the brief form
- **Mermaid.js** for the live flowchart preview and PNG export
- **@react-pdf/renderer** for server-side PDF generation
- **JSZip** for bundling the export artifacts

## Quick start

```bash
git clone <repo> 4brains-brief-tool
cd 4brains-brief-tool
npm install

# 1. Apply the SQL schema to your Supabase project.
#    Open Supabase Dashboard → SQL Editor → paste supabase/migrations/00001_init.sql → Run.

# 2. Set environment variables in .env (see below).

# 3. Bootstrap the admin + sample PM (idempotent).
npm run db:bootstrap

# 4. Run the dev server.
npm run dev
# → http://localhost:3000
```

### Environment variables

`.env` for local dev:

```
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."
```

Get all three from **Supabase Dashboard → Settings → API Keys** (the new
Stripe-style keys; the old anon/service_role keys still work but their
naming is being phased out).

The `SUPABASE_SECRET_KEY` is server-only and bypasses RLS — never ship it
to the browser. The codebase enforces this with `import "server-only"` in
[`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts).

### Default credentials (after bootstrap)

| Role  | Email                | Password   |
| ----- | -------------------- | ---------- |
| ADMIN | `ujwal@4brains.in`   | `ujwal123` |
| PM    | `priya@4brains.in`   | `priya123` |

Edit [`scripts/bootstrap.ts`](scripts/bootstrap.ts) to change these. The
script is idempotent — re-running with the same emails is a no-op.

## Useful scripts

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Next.js dev server                        |
| `npm run build`        | Production build                          |
| `npm run lint`         | ESLint                                    |
| `npm run db:bootstrap` | Idempotently insert/upsert default users  |

## Project structure

```
src/
  app/
    (app)/                       # routes that require auth (route group)
      page.tsx                   # / — dashboard
      briefs/
        new/page.tsx             # /briefs/new
        [id]/
          page.tsx               # /briefs/[id] — read-only detail
          edit/page.tsx          # /briefs/[id]/edit
      layout.tsx                 # header + main shell
      not-found.tsx, loading.tsx, error.tsx
    login/page.tsx               # /login (no chrome)
    api/
      briefs/                    # POST create
      briefs/[id]/               # PATCH update
      briefs/[id]/export/        # POST export → PDF + PNG + ZIP
  components/
    Header.tsx, Banner.tsx, Dashboard.tsx
    brief/
      BriefForm.tsx              # form orchestrator (auto-save, validation, sticky bar)
      BriefDetail.tsx            # read-only renderer
      Section.tsx, Field.tsx, MermaidPreview.tsx
      sections/Section1.tsx … Section11.tsx
  lib/
    supabase/
      browser.ts                 # client component Supabase client
      server.ts                  # server component / route handler client (cookie-aware)
      admin.ts                   # service-role client (bypasses RLS)
    briefs.ts, briefData.ts, briefSchema.ts
    exportSections.ts            # field defs shared by PDF + detail view
    exportPdf.tsx                # @react-pdf/renderer document
    clientExport.ts              # mermaid → PNG + multipart upload
  middleware.ts                  # Supabase SSR session refresh + auth gate
supabase/
  migrations/00001_init.sql      # schema, RLS policies, triggers
scripts/
  bootstrap.ts                   # seed admin + PM via Admin API
public/
  exports/                       # generated PDFs, PNGs, ZIPs (dev only — gitignored)
```

## Architecture notes

- **Auth.** Email/password via `supabase.auth.signInWithPassword`.
  `middleware.ts` runs `supabase.auth.getUser()` on every request, refreshes
  the session cookie if needed, and redirects unauthenticated requests to
  `/login` with a `?next=` parameter. Server components and API routes
  fetch the session via `createSupabaseServerClient()`. Client components
  use `createSupabaseBrowserClient()`.
- **Authorization.** Done by Postgres RLS, not by app code. Brief access is
  gated by `created_by_id = auth.uid() OR pm_id = auth.uid() OR is_admin()`.
  The dashboard query has no `WHERE` clause — RLS does the filtering.
- **Data shape.** All form fields live in a single `data` jsonb column on
  `briefs`. This lets the form schema evolve without DB migrations. Status
  is a Postgres enum (`brief_status`), and roles are a Postgres enum
  (`user_role`).
- **Profile creation on signup.** A Postgres trigger (`on_auth_user_created`)
  inserts a row into `profiles` whenever a new user is created in
  `auth.users`, reading `name` and `role` from
  `raw_user_meta_data`. The bootstrap script and Supabase Dashboard both
  set this metadata when creating users.
- **Auto-save.** A `setInterval` ticks every 30 seconds and PATCHes the
  brief if a snapshot diff shows the form is dirty. Auto-saves carry only
  `data`; explicit "Save Draft" / "Send to PM" / "Export" actions also pass
  `status`.
- **Change log.** Only explicit user actions write a `change_logs` entry —
  create, status change, export. Auto-saves do not, otherwise the timeline
  would fill with noise. The table is append-only at the RLS layer
  (no UPDATE/DELETE grants for `authenticated`).
- **Validation flow.** "Send to PM" and "Export" call
  `getMissingRequiredFields` on the client, set per-field errors via
  React Hook Form, and scroll the first missing field into view. The
  server re-validates the same rules before exporting.
- **Export pipeline.**
  1. Client validates and force-saves the draft.
  2. Client renders Mermaid → SVG → PNG via canvas
     (`buildFlowchartPng`).
  3. Client `POST`s the PNG as multipart to
     `/api/briefs/[id]/export`.
  4. Server reads the brief, renders the PDF, embeds the PNG in
     Section 4, zips PDF + PNG, writes all three to
     `public/exports/{briefId}/`, updates `status` + URL fields,
     returns URLs.
  5. Client triggers a download of the ZIP and redirects to the
     dashboard.

## Schema reference

See [`supabase/migrations/00001_init.sql`](supabase/migrations/00001_init.sql) for the full,
authoritative schema. Summary:

- **Enums**: `user_role` (CS_BD / PM / ADMIN), `brief_status` (DRAFT /
  IN_REVIEW / APPROVED / ARCHIVED).
- **Tables**: `profiles` (1:1 with `auth.users`, holds name + role),
  `briefs` (status, created_by, pm, jsonb data, exported URLs,
  timestamps), `change_logs` (append-only audit trail, cascades on
  brief delete).
- **Triggers**: `briefs_set_updated_at` bumps `updated_at` on every
  UPDATE; `on_auth_user_created` auto-creates the profile row.
- **RLS**: enabled on all three tables. See SQL comments for the
  per-action policies.

## Deploying to Vercel

The app builds and runs on Vercel out of the box, **with one caveat**:

- **Move export storage off the local filesystem.** The export route
  currently writes to `public/exports/`, which is read-only on Vercel
  at runtime. The fix is small — replace the three `fs.writeFile`
  calls in
  [`src/app/api/briefs/[id]/export/route.ts`](src/app/api/briefs/[id]/export/route.ts)
  with Supabase Storage uploads. The rest of the export pipeline
  (validation, PDF rendering, zipping, DB updates) is
  storage-agnostic. Look for the `// TODO(production)` comment in
  that file.

The database side already works on any host (Supabase is a hosted
service — no local DB on Vercel needed).

To deploy:

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel env add SUPABASE_SECRET_KEY production
vercel --prod
```

(The `NEXT_PUBLIC_*` vars are also accessible at build time.)

## Wiring email notifications (later)

The "Send to PM" flow currently shows a banner on the dashboard but
doesn't send an email. Two options:

**Option 1 — Resend (free tier, no card).**

```bash
npm install resend
# vercel env add RESEND_API_KEY production
```

Then in [`src/app/api/briefs/[id]/route.ts`](src/app/api/briefs/[id]/route.ts), after the
`IN_REVIEW` status write:

```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);
if (nextStatus === "IN_REVIEW" && existing.pm_id) {
  // Look up PM email via service-role client (profiles doesn't have it)
  const admin = getSupabaseAdminClient();
  const { data: pmUser } = await admin.auth.admin.getUserById(existing.pm_id);
  if (pmUser?.user?.email) {
    await resend.emails.send({
      from: "noreply@4brains.in",
      to: pmUser.user.email,
      subject: `New brief ready for review: ${data.projectName}`,
      text: `Open: https://your-domain.com/briefs/${brief.id}`,
    });
  }
}
```

**Option 2 — Supabase Database Webhooks** triggered by status changes,
hitting your own email service. More work, more durable.

## Known limitations

- **File uploads are stubs.** The form's file inputs (reference attachments,
  brand guidelines, logos, mood boards, sample data, custom flowchart
  override) persist only the file name to the draft. Wiring real uploads
  needs Supabase Storage buckets and signed-URL handling.
- **Status workflow is simple.** Anyone with edit rights can flip status to
  `IN_REVIEW` via Send to PM. There's no PM-side "approve / send back"
  workflow yet — `APPROVED` and `ARCHIVED` are reserved in the enum but
  unused in the UI.
- **Section 7 auto-completes on a fresh form** because both Y/N defaults
  are "No", which is a valid answer per spec. If you want users to
  explicitly affirm each toggle, switch the relevant fields from
  `boolean` to `"" | "Yes" | "No"` and treat untouched as missing.
- **Export storage isn't garbage-collected.** Re-exporting overwrites in
  place for the same filename, but stale artifacts can accumulate if
  project name or date changes. Easy to add when we move to Supabase
  Storage.
- **PDF uses Helvetica** (built into `@react-pdf/renderer`), not Inter,
  to avoid bundling a font file. Swap if you want the brand font in the
  PDF.
- **PM dropdown shows just name, not email.** `profiles` doesn't store
  email (it's in `auth.users`, only readable via service-role). If you
  want email in the dropdown, add a synced `email` column to `profiles`
  via the existing `handle_new_user` trigger.
- **`/_sqlite_backup/`** at the project root is a snapshot from the
  pre-Supabase era, kept as a rollback safety net during the migration.
  Safe to delete once you trust the Supabase setup is stable.

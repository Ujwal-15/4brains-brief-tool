# 4Brains Brief Tool

Internal web tool for the 4Brains Technologies CS/BD team to capture
structured project briefs, send them to PMs for review, and export a polished
PDF + auto-generated user-journey flowchart for the dev team.

## Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** — minimal black/white/gray with a single amber accent (`#D4811C`)
- **Prisma** + **SQLite** (local dev) — easy to swap to Postgres for production
- **NextAuth** (Credentials provider, JWT sessions)
- **React Hook Form** + **Zod**
- **Mermaid.js** for the live flowchart preview and PNG export
- **@react-pdf/renderer** for server-side PDF generation
- **JSZip** for bundling the export artifacts

## Quick start

```bash
git clone <repo> 4brains-brief-tool
cd 4brains-brief-tool
npm install

# Create a local SQLite DB, run the init migration, generate the client
npm run db:migrate

# Seed an admin and a sample PM (idempotent)
npm run db:seed

npm run dev
# → http://localhost:3000
```

### Default credentials

| Role  | Email                | Password   |
| ----- | -------------------- | ---------- |
| ADMIN | `ujwal@4brains.in`   | `ujwal123` |
| PM    | `priya@4brains.in`   | `priya123` |

Change these in `prisma/seed.ts` and re-run `npm run db:seed` (it upserts).

### Environment variables

A `.env` is created on first setup with sensible defaults. For
production-style values, see `.env.example`:

```
DATABASE_URL="file:./dev.db"           # swap for postgresql://… in prod
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me"            # generate via: openssl rand -base64 32
```

## Useful scripts

| Command              | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Next.js dev server                        |
| `npm run build`      | Production build                          |
| `npm run lint`       | ESLint                                    |
| `npm run db:migrate` | Run pending Prisma migrations + generate  |
| `npm run db:push`    | Push schema without a migration (dev only)|
| `npm run db:seed`    | Insert / upsert default users             |
| `npm run db:studio`  | Open Prisma Studio                        |

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
      auth/[...nextauth]/        # NextAuth handler
      briefs/                    # POST create
      briefs/[id]/               # PATCH update
      briefs/[id]/export/        # POST export → PDF + PNG + ZIP
      users/                     # GET (filter by role=PM)
  components/
    Header.tsx, Providers.tsx, Banner.tsx, Dashboard.tsx
    brief/
      BriefForm.tsx              # form orchestrator (auto-save, validation, sticky bar)
      BriefDetail.tsx            # read-only renderer
      Section.tsx, Field.tsx, MermaidPreview.tsx
      sections/Section1.tsx … Section11.tsx
  lib/
    auth.ts                      # NextAuth config
    prisma.ts                    # singleton client
    briefs.ts, briefData.ts, briefSchema.ts
    exportSections.ts            # field defs shared by PDF + detail view
    exportPdf.tsx                # @react-pdf/renderer document
    clientExport.ts              # mermaid → PNG + multipart upload
prisma/
  schema.prisma, seed.ts, migrations/
public/
  exports/                       # generated PDFs, PNGs, ZIPs (dev only — gitignored)
```

## Architecture notes

- **Auth.** Email/password via `CredentialsProvider`. JWT sessions; `id` and
  `role` are propagated via the `jwt` and `session` callbacks. `middleware.ts`
  protects everything except `/login`, `/api/auth/*`, and Next.js internals.
- **Data shape.** All form fields live in a single `data` JSON string on
  `Brief`. SQLite doesn't support `Json` columns through Prisma, so the field
  is `String`; the app stringifies/parses at the boundary. This lets the form
  schema evolve without migrations — only model-level fields (`status`,
  `pmId`, the export URLs) need DDL.
- **Auto-save.** A `setInterval` ticks every 30 seconds and PATCHes the brief
  if a snapshot diff shows the form is dirty. Auto-saves carry only `data`;
  explicit "Save Draft" / "Send to PM" / "Export" actions also pass `status`.
- **Change log.** Only explicit user actions write a `ChangeLog` entry —
  create, status change, export. Auto-saves do not, otherwise the timeline
  would fill with noise.
- **Validation flow.** "Send to PM" and "Export" call `getMissingRequiredFields`
  on the client, set per-field errors via React Hook Form, and scroll the
  first missing field into view. The server re-validates the same rules
  before exporting (defense in depth).
- **Export pipeline.**
  1. Client validates and force-saves the draft.
  2. Client renders Mermaid → SVG → PNG via canvas (`buildFlowchartPng`).
  3. Client `POST`s the PNG as multipart to `/api/briefs/[id]/export`.
  4. Server reads the brief, renders the PDF (`@react-pdf/renderer`,
     embedding the PNG in Section 4), zips PDF + PNG, writes all three to
     `public/exports/{briefId}/`, updates `status` + URL fields, returns
     URLs.
  5. Client triggers a download of the ZIP and redirects to the dashboard.

## Deploying to Vercel

The app builds and runs on Vercel out of the box, **with two caveats**:

1. **Move the database.** SQLite won't work on Vercel — point `DATABASE_URL`
   at a hosted Postgres (Neon, Supabase, Vercel Postgres). Update the Prisma
   `datasource db { provider = "postgresql" … }` block, run a fresh migration
   against the new database, and re-seed.
2. **Move export storage.** The export route writes to `public/exports/` on
   the local filesystem. Vercel's filesystem is read-only at runtime, so
   deployed exports will fail. The fix is small — replace the three
   `fs.writeFile` calls in `src/app/api/briefs/[id]/export/route.ts` and the
   URL construction with object-storage uploads (S3, R2, or similar). The
   rest of the export pipeline (validation, PDF rendering, zipping, DB
   updates) is storage-agnostic. Look for the
   `// TODO(production)` comment in that file.

Once those two are done:

```bash
vercel link
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production       # https://your-domain.com
vercel env add NEXTAUTH_SECRET production    # openssl rand -base64 32
vercel --prod
```

If you wire S3/R2, also add the bucket creds via `vercel env add`.

## Wiring email notifications (later)

The "Send to PM" flow currently shows a banner on the dashboard but doesn't
send an email. To add Resend (free tier, no card required):

```bash
npm install resend
# vercel env add RESEND_API_KEY production
```

Then in `src/app/api/briefs/[id]/route.ts`, after the `IN_REVIEW` status
write:

```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);
if (nextStatus === "IN_REVIEW" && existing.pmId) {
  const pm = await prisma.user.findUnique({ where: { id: existing.pmId } });
  if (pm?.email) {
    await resend.emails.send({
      from: "noreply@4brains.in",
      to: pm.email,
      subject: `New brief ready for review: ${data.projectName}`,
      text: `Open: https://your-domain.com/briefs/${brief.id}`,
    });
  }
}
```

(You'll also need to verify the `from` domain in Resend.)

## Known limitations

- **File uploads are stubs.** The form's file inputs (reference attachments,
  brand guidelines, logos, mood boards, sample data, custom flowchart
  override) persist only the file name to the draft. Wiring real uploads
  needs an endpoint and a storage backend (same swap as the export route).
- **Status workflow is simple.** Anyone with edit rights can flip status to
  `IN_REVIEW` via Send to PM. There's no PM-side "approve / send back"
  workflow yet — `APPROVED` and `ARCHIVED` are reserved in the schema but
  unused in the UI.
- **Section 7 auto-completes on a fresh form** because both Y/N defaults are
  "No", which is a valid answer per spec. If you want users to explicitly
  affirm each toggle, switch the relevant fields from `boolean` to
  `"" | "Yes" | "No"` and treat untouched as missing.
- **Export storage isn't garbage-collected.** Re-exporting overwrites in place
  for the same filename, but stale artifacts can accumulate if project name
  or date changes. Easy to add when we move to object storage.
- **PDF uses Helvetica** (built into `@react-pdf/renderer`), not Inter, to
  avoid bundling a font file. Swap if you want the brand font in the PDF.

# Farm To Home — Grocery Delivery Site

Next.js (App Router) + TypeScript + Tailwind storefront with a database-backed
Admin CMS for editing the Home and About Us pages. See `CLAUDE.md` for the
project's standards and rules.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Prisma ORM (Postgres) for `PageSection`, `Product`, `LoginAttempt`
- Supabase: Postgres hosting, Auth (admin login), Storage (CMS image uploads)

## First-time setup

The repo has no live database connection yet — `.env` contains placeholder
values so `pnpm build`/`pnpm dev` run, but every admin/CMS feature needs a
real Supabase project.

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Copy credentials into `.env`** (see `.env.example` for where to find each value in the Supabase dashboard):
   - `DATABASE_URL` — Project Settings → Database → Connection string (the pooled/pgbouncer one works)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` key (**server-only, never commit or expose client-side**)

3. **Create the admin user.** There's no public sign-up page (single admin account, per spec) — add one manually: Supabase Dashboard → Authentication → Users → Add user (set email + password directly, skip the invite email).

4. **Create the Storage bucket** CMS image uploads go to: Dashboard → Storage → New bucket → name it `cms-images` → make it **public** (so `getPublicUrl()` URLs are directly viewable on the storefront).

5. **Enable Row Level Security on the new tables.** Prisma connects to Postgres directly (not through Supabase's client SDK), so these tables are never reachable from the browser regardless of RLS — access is gated entirely by the Next.js server-side auth checks in every Server Action. Enabling RLS with no permissive policies is still worth doing as defense-in-depth (blocks any accidental exposure via the Supabase client or dashboard "API" access). Run once in the Supabase SQL editor:
   ```sql
   ALTER TABLE "PageSection" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;
   ```

6. **Create the tables and migrate the existing content:**
   ```bash
   pnpm db:migrate   # creates PageSection / Product / LoginAttempt tables
   pnpm db:seed      # migrates content/homepage.ts + content/about.ts into the database
   ```
   The seed is safe to re-run (every write is an upsert) and does not change what
   the live site looks like — it moves the exact current copy into the database.

7. **Run the app:**
   ```bash
   pnpm dev
   ```
   Storefront: [http://localhost:3000](http://localhost:3000). Admin CMS:
   [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

## Admin CMS

- `/admin/cms/home` and `/admin/cms/about` — every section on each page as a
  collapsible card: enable/disable toggle (saves immediately), text fields,
  image uploads. Each section saves independently.
- `/admin/products` — product catalog; tag products to control which
  homepage list sections (Weekly Best Seller, Deals of the Day, Recently
  Added, Top Selling, Top Rated) they appear in.
- Editing content revalidates the live storefront page within seconds — no
  redeploy needed.
- Adding a future page to the CMS: add one entry to `pages` in
  `lib/cms/sections.config.ts`, plus its section definitions in the same
  file. The sidebar and editor UI pick it up automatically.

## Everyday commands

```bash
pnpm dev          # start the dev server
pnpm build        # production build
pnpm lint         # eslint
pnpm db:migrate   # apply Prisma schema changes
pnpm db:seed      # re-run the content seed (upsert, safe to repeat)
pnpm db:studio    # browse the database in Prisma Studio
```

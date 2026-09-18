# Together / Thirty

A private 30-day workout and meal journal for Dhruv and Annanya, transcribed from their two different PDFs. Next.js App Router, TypeScript, Tailwind, Supabase Auth/PostgreSQL, ready for Vercel.

## What is included

- Today dashboard and distinct profile spaces; full 30-day calendar, daily exercise/meal tracking, optional results and shared notes.
- Actual weekday vegetarian rules for Dhruv; sequence-based workouts and Annanya meal rotation.
- Four weeks of progression, recovery/rest, benchmarks, ankle substitutions, all source notes.
- Measurements, real-data trend charts, weekly check-ins, adherence and streaks.
- Owner-only server mutations and PostgreSQL RLS, with mutually readable profiles.
- SQL migrations, deterministic transactional seed, field-by-field database verification and PostgreSQL policy tests.

`docs/ARCHITECTURE.md` describes the design. `docs/PLAN_EXTRACTION.md` audits all 60 days and records genuine ambiguities. Source PDFs are not publicly served. Keep this repository private because its source data contains personal plan information.

## Local setup

Use Node.js 24 LTS and npm (`nvm use` reads `.nvmrc`). Dependencies are pinned in `package-lock.json`. Run commands from the repository root, which is now the `human-v2` folder.

```sh
npm ci
cp .env.example .env.local
# Fill the values locally; never commit .env.local.
npm run db:migrate
npm run db:seed
npm run db:verify
npm run dev
```

Open http://127.0.0.1:3000. `/` redirects through `/app/today` to the login screen until authenticated. The development-only `/dev-preview` shows the actual extracted plans with **zero activity and disabled writes** for design review; it always returns 404 in production. It is not an authentication bypass for any database content. The dev server binds to loopback by default.

## Environment

| Variable                                      | Purpose                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                | Supabase PostgreSQL pool connection; developer migration/seed/verification scripts only        |
| `NEXT_PUBLIC_SUPABASE_URL`                    | Project API URL; needed by the server-side Supabase client                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`               | Publishable key or legacy anon key; deliberately non-privileged                                |
| `APP_TIMEZONE`                                | Local date boundary, default `Asia/Kolkata`; migration writes the same value to `app_settings` |
| `NEXT_PUBLIC_APP_URL`                         | Deployment URL for setup documentation; configure the matching Supabase Site URL               |
| `DHRUV_AUTH_USER_ID` / `ANNANYA_AUTH_USER_ID` | Existing Supabase Auth UUIDs, used only by the link script                                     |

No service-role key is required. Application requests use the user's JWT, never the direct database connection or an admin client. `postgres.js` uses one connection, TLS and `prepare:false` for Supabase pooling. The public application uses Supabase's HTTP data API, so Vercel requests do not accumulate database connections. An ORM would add a second schema layer without improving this small RLS-first app, so migrations + typed Supabase queries are used instead.

## Supabase and authentication

1. Create the project, copy its project URL, publishable key and pool connection into local environment configuration.
2. Run migrations and seed once. The migration refuses to silently replace existing conflicting tables; migrations are recorded in `tracker_migrations` under an advisory lock.
3. In Supabase **Authentication → Users**, create exactly the two email/password accounts. Set their passwords privately; do not add them to source or chat. If adding verified accounts manually, use the dashboard's confirmation option so they can sign in.
4. In **Authentication → settings / Sign In / providers**, turn **Allow new users to sign up** off. Keep email/password sign-in enabled. There is no registration UI or signup call in this app. Even if project-level signup is accidentally enabled, unlinked accounts still have no access to data.
5. Put the existing account UUIDs into `DHRUV_AUTH_USER_ID` and `ANNANYA_AUTH_USER_ID`, then run `npm run db:link-users`. The script verifies they exist, are distinct, and refuses to replace an existing mapping.
6. Set Supabase Auth Site URL to the final HTTPS application URL. This version uses password login without OAuth or magic links, so no `/auth/callback` route is needed. If enabling external email recovery later, configure its redirect route explicitly; password recovery is currently managed from the Supabase dashboard.
7. Each person signs in and sets their own start date to today or a future date. The date can be set once; it is not casually reset. Developer date corrections require reviewing existing progress and menus first. Never silently move a program after tracking begins.

Only the two stored `auth_user_id` values grant membership. User metadata, email text and browser-supplied profile IDs cannot grant access. A user with an unrelated Auth account gets a generic access-denied response and zero rows under RLS. Do not put a service-role key in browser variables. Supabase's login rate limiting applies; no custom public registration or email sending is implemented.

## Data and authorization

13 RLS-enabled application tables: settings, profiles, programs, program days, plan tasks, meal slots, meal alternatives, plan reference notes, allowed metrics, task progress, meal progress, measurements and weekly check-ins. Foreign keys bind tracking entries to the correct person/day/task or rotation slot. Unique compound keys make writes idempotent. SQL validation rejects future dates, wrong weekday meals, invalid measurements and future weekly check-ins even through the direct data API.

Owners have INSERT/UPDATE on their own progress. Both members can SELECT. Anonymous users have no table grants; unmapped authenticated users receive no rows. Neither member can mutate definitions, identity mappings, dates directly or delete progress. A tightly scoped SQL function permits a one-time start date. App server actions validate inputs, reverify identity with Supabase `getUser`, derive the owner from the authenticated profile and use RLS-protected upserts. Next.js Server Actions enforce same-origin requests.

Concurrent requests from a device are serialized by Server Actions and the pending control is disabled. Across devices, the last successful upsert for the same row wins; this deliberate simple policy is appropriate for one editor per profile. The UI never announces completion before the server confirms it. Network failures retain the old saved state and display a retry message. No localStorage fitness data, fake analytics, background mail or filesystem persistence is used.

Definitions and progress remain separate. Seed operations do not alter completed records, start dates or identity mappings. Full source notes are stored as individual page records, not as a JSON plan blob.

## Dates and program completion

Date-only starts are stored in PostgreSQL. UTC timestamps record saves. Local day boundaries use the configured timezone both in SQL and on the server; the app fails closed if settings disagree. Annanya keeps her workout and meal sequence on program days; Dhruv workouts use program days and meals use the **real ISO weekday**. No start date means no guessing his daily menu.

Completion means all required session tasks and meals for a due day; optional snacks and full-rest contextual step goals are excluded. Recovery/rest adherence counts toward streaks but not strength-session counts. Upcoming days cannot count. Logged measurement averages disclose their denominator. See the extraction document for the precise streak and ambiguity rules.

## Routes and components

- `/login`: email/password, no signup.
- `/app/today`: signed-in person's current program day.
- `/app/dhruv/overview`, `/exercise`, `/meals`, `/progress` (same routes for Annanya).
- Add `?day=1` through `?day=30` to inspect history or upcoming days.
- Server-rendered dashboard, data access and authorization; small client components for task/meal/results/start/check-in forms.
- Detailed task queries load only the selected day. Lightweight task metadata supports 30-day totals for both people. Independent reads are batched; there are no per-day SQL query loops.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run db:verify
```

Unit tests cover all calendar assignments, progression anchors, date boundaries, timezone rollover, vegetarian rules, completion, optional meals, rest/recovery and streaks. PGlite runs the actual PostgreSQL migration with authenticated/anonymous roles to test both directions of unauthorized writes, unknown identities, protected definitions, compound FKs, future-day/meal checks and one-time date setting. These do not need your hosted credentials. `db:verify` uses the provided hosted connection to compare all seeded fields and RLS flags.

The production build uses Next.js's supported Webpack compiler because this host's sandbox prevented Turbopack's build worker from binding its internal port. Development still uses Turbopack. No remote font fetch is required.

## Vercel deployment

1. Push this folder to a **private** GitHub repository and import that repository into Vercel. Leave Vercel Root Directory at `.` (do not select a `together` subfolder). `vercel.json` supplies the framework, install command and build command.
2. Framework: Next.js. Node: 24.x. Install: `npm ci`. Build: `npm run build`. Use the normal `.next` output, not static export.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `APP_TIMEZONE=Asia/Kolkata`, and `NEXT_PUBLIC_APP_URL=https://your-deployment-domain` for the appropriate environment. Rebuild after changing public environment variables.
4. Do **not** add `DATABASE_URL` or Auth mapping IDs to Vercel unless you are intentionally running a separate controlled migration job; the web runtime does not need them. Never run migration/seed commands on each request or as an automatic build hook.
5. Match the Supabase Site URL, turn off public signup, and link both Auth users before use. Use Vercel deployment protection for preview deployments when available.
6. Verify production returns 404 for `/dev-preview`, unauthenticated `/app/today` redirects to login, both real users can log in, own updates persist after refresh, peers cannot mutate, and the real local date resolves correctly.

Nothing relies on writable runtime files. All private pages are dynamic and marked no-store at the proxy; no user progress is in a public cache. Metadata discourages indexing, and headers deny framing, MIME sniffing and unnecessary device permissions.

## Delivery status

See `docs/VALIDATION.md` for verified checks and remaining account/deployment dependencies. Do not treat a passing build as proof that uncreated Auth accounts can log in or that Vercel is already deployed.

## Implementation references

Session handling follows [Supabase's server-side Auth guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client). Mutation boundaries follow [Next.js Server Actions](https://nextjs.org/docs/app/guides/server-actions) and the installed Next.js documentation under `node_modules/next/dist/docs`. The explicit SQL access test is available with `npm run db:verify-access`; it rolls back every test write.

## Repository portability and GitHub

This folder contains the complete application: SQL migrations, seed data, tests, configuration, documentation, and original PDFs in `docs/source-pdfs/`. No runtime file is read from Downloads or the previous Codex workspace. Dependencies/build output can be recreated with `npm ci` and `npm run build`.

`.env.local` remains local and is excluded by `.gitignore` and `.vercelignore`. `.env.example` is the committed template. The database URL and Auth mapping IDs are only needed for developer database scripts; Vercel needs only the four runtime variables listed in the deployment section. Set those in Vercel Project Settings, not in GitHub source.

Once this folder contains the relocated `.git` directory, create an empty private GitHub repository without an initial README, then run from here (replace the example remote):

```sh
git add .
git commit -m "Prepare portable Vercel project"
git remote add origin git@github.com:YOUR_ACCOUNT/human-v2.git
git push -u origin main
```

Skip the commit command if there are no uncommitted changes. The GitHub Actions workflow installs locked dependencies, checks TypeScript and lint, runs PostgreSQL policy tests, and builds the application. It needs no Supabase or database secrets: tests use an isolated embedded database. A GitHub push does not run hosted migrations or seeds. No GitHub remote is configured automatically.

Configuration references: [Vercel project configuration](https://vercel.com/docs/project-configuration), [GitHub checkout](https://github.com/actions/checkout), and [Node setup](https://github.com/actions/setup-node).

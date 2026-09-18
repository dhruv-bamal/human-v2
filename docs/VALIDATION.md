# Validation record — 18 September 2026

## Verified

- Read both PDFs completely (7 + 9 pages). Checked rendered training/progression/calendar/menu tables. Audited all 60 day assignments in `PLAN_EXTRACTION.md`.
- Hosted Supabase migration applied successfully; 13 application tables have RLS.
- Seeded 2 programs, 60 days, 367 trackable tasks, 49 rotating meal slots, 147 meal alternatives, 16 full source-page notes, and 11 person-specific measurement definitions.
- Hosted verification compares every field with the structured source. Seed was rerun successfully without duplicate rows. It never updates identity links, start dates or progress. The seed uses bounded batches and an advisory-locked transaction.
- Linked the two user-provided Auth UUIDs. Both accounts are email-confirmed. Confirmed Supabase public signup is disabled via the Auth settings endpoint.
- Live anonymous REST request for program data is denied.
- Live PostgreSQL transaction tests confirm both owners can insert/update their own tracking data, both can read both profiles, neither can modify peer records, and future-day writes fail. **All test writes and temporary date changes were rolled back.**
- 14 automated tests pass, including the real migration in embedded PostgreSQL, authorization in both directions, unknown/anonymous accounts, date boundaries, local midnight, every start weekday × 30 menu days, optional meals, rest/recovery, progression anchors, all 60 assignments, unique relationships and streaks.
- TypeScript and ESLint pass with zero errors/warnings.
- Production compilation, TypeScript and page generation pass with Next.js Webpack. Automated tests also pass under Node 24 LTS (the Vercel-configured runtime).
- Desktop and mobile (390px) visual review of the real extracted plans. Confirmed Annanya accent/read-only messaging and disabled peer controls in the local design view. Reviewed prescriptions and menus against the source tables.
- User signed into Dhruv in Chrome; authenticated `/app/today` was visually verified with the actual database, correct Dhruv identity and unset-start state. The start date form is available to the owner; tracking is disabled before start.
- Environment secrets are ignored, not included in source control. Browser code does not receive the database connection.

## Intentional pending setup

- Each person still needs to choose their own program start date in the app. No start dates or real fitness progress were invented for testing.
- Annanya's password login has not been exercised interactively; her confirmed account mapping and database permissions are verified.
- An authenticated browser checkbox/save cycle after a chosen start date has not been exercised; owner writes, data constraints and idempotent upserts are verified directly in real PostgreSQL.
- Vercel deployment is prepared and documented, but no Vercel project was linked or published during this run.

The local `/dev-preview` route is read-only and development-only; production access returns 404. Use the authenticated app for real tracking.

## Relocation validation

Application files and owner-only `.env.local` moved to `Desktop/human-v2`. Original PDFs are included in `docs/source-pdfs/`. Node 24 selection, explicit Vercel build configuration, GitHub Actions CI, and environment/dependency exclusions are included. All dependency symlinks resolve within this directory. TypeScript, lint, all 14 tests, and a clean production build pass from this location. The user initialized a new Git repository in this folder and configured the GitHub origin. That repository is preserved. `project-history.bundle` is a verified complete backup of the earlier repository history; the old location contains only its protected Git metadata, not application files.

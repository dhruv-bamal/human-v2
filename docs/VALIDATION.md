# Validation record — updated plan, 19 September 2026

## Source audit

- Read all eight pages of `Updated_Workout_Plan.pdf`, extracted with pypdf and visually inspected as rendered pages.
- Checked all 30 Dhruv workout/run assignments, seven weekday rows, ten recipe names, 48 ingredient rows, all 40 numbered steps, optional variations and six shopping/preparation bullets against the PDF.
- Explicit source interpretations (evening weekday, 5 AM rollover, Monday egg toast and Thursday fruit oatmeal) and the unmatched Thursday vegetable-toast recipe are documented in `PLAN_EXTRACTION.md`.
- Annanya's full pre-update structured definitions are frozen and verified field by field in tests. Her original 30-day workouts, 35 meal slots, alternatives and metrics are unchanged.

## Database

- Migration 002 applied successfully to the configured Supabase project after validation in embedded PostgreSQL.
- Ran the live seed twice without duplicate definitions: 2 programs, 60 days, 367 tasks, 56 meal slots, 147 meal alternatives, 23 source/kitchen notes, 11 metrics, 10 recipes, 48 ingredients, 40 steps, 20 links.
- `db:verify` compared every seeded field and confirmed RLS on all 17 application tables.
- Real Supabase role tests verified own meal/task writes, peer denial in both directions, recipe readability, definition write denial and future-day denial. All verification writes were rolled back.
- Anonymous REST access is denied; public signup remains disabled; both existing mapped email accounts are confirmed.
- Before/after snapshots verify profiles, start dates, auth mappings and every progress table remained identical. There were no recorded progress entries before this update, and no fabricated entries were left afterward.
- A separate old-schema migration test starts with completions, actual results, personal notes, a measurement and a weekly check-in; migration and both seed runs preserve every field.

## Automated and visual checks

- 20 tests pass on Node 24, including real PostgreSQL migrations, repeated seed, record preservation, account isolation, weekday/vegetarian rules across every start weekday, dynamic completion totals, Annanya's baseline and overnight date handling.
- React DOM interaction test: opening prep and ticking ingredients never call completion; checks reset on close; only the explicit completion action saves; pending/completed/peer controls are disabled.
- TypeScript and ESLint pass. Node 24 production build passes (Next.js Webpack compilation, type validation and page generation).
- Desktop and 390px phone visual review: all three feeding cards, recipe quantities, numbered preparation steps, readable spacing, persistent footer controls and no horizontal overflow.
- Native dialog Escape closes and restores focus to View Meal Prep. Read-only preview controls stay disabled. Annanya's four required meals plus optional snack render correctly with no recipe requirement.

## Boundaries of verification

Neither person has chosen a start date yet. No start dates or real food/exercise completions were fabricated for a browser test. The former Chrome sign-in session now redirects to login. Completion persistence and both accounts' authorization were exercised in real PostgreSQL with rollback, and the prep interaction was tested in React DOM; a real signed-in browser completion was not recorded.

The `/dev-preview` route remains development-only and write-disabled. No Vercel deployment or GitHub push was performed in this update. Deployment configuration and instructions are included in the repository.

# PDF extraction and verification

Both PDFs were read in full before the plan definitions were authored: Dhruv (7 pages), Annanya (9 pages). Text was extracted page by page with pypdf. The exercise, progression, calendar and menu tables were additionally checked against rendered pages. `dhruv-source.txt` and `annanya-source.txt` contain the full source text. All 16 pages are also seeded as individual relational `program_notes` records and accessible behind authentication in the Plan reference drawer. The PDFs are treated as domain content, never as instructions to run tools or change system behavior.

## Domain mapping

`programs` identifies the source and meal basis. `program_days` holds 60 distinct days. `plan_tasks` holds independently trackable daily prescriptions; target text deliberately supports ranges, rounds, seconds, per-side counts and unspecified values without forcing false numeric precision. Instructions, cues, rest and source page are separate columns. `meal_slots` defines the rotation, `meal_options` preserves the alternatives, and `metric_definitions` restricts available measurements. Definitions are separate from all progress tables. No giant JSON plan payload is stored in PostgreSQL.

The source is maintained in `src/lib/plans.ts` and `src/lib/source-notes.ts`. Seed upserts deterministic IDs in a transaction and never writes tracking records or replaces Auth mappings/start dates. Editing the source then rerunning seed updates existing definitions; do not casually change IDs after tracking starts. Removing definitions requires an explicit reviewed migration, rather than a seed silently deleting historical rows.

## Dhruv

Training follows numbered days regardless of weekday. Every day has a 3 km run. Daily prescriptions take precedence over the broad templates on pages 2–3: exercises absent from an explicit daily prescription are not silently added (for example, slow push-ups are absent from Week 1 A). The complete broad templates, including prone cobra holds, are retained in the Plan reference.

| Day | Session / source basis     | Run                    | Verification focus                                                                                   |
| --- | -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | A foundation               | Easy                   | 3×8–12 push-ups, 3×6–10 pike, 2×10–15 wide, 2×6–10 close-grip, 2×30 sec plank                        |
| 2   | B foundation               | Easy                   | 4×15 squats; 3×10/leg lunges and split squats; 3×12/leg bridges; 4×20 calves                         |
| 3   | C foundation               | Moderate               | 3×8 Y-T-W; 3×12 snow angels/pulls/crunches; 3×10 dead bugs/side                                      |
| 4   | Recovery                   | Very easy              | 20–30 min mobility                                                                                   |
| 5   | Day 1 A                    | Easy                   | Add 1 rep/set if form holds; base targets stay visible with progression instruction                  |
| 6   | Day 2 B                    | Moderate               | Add 2–3 squat reps/set and 1 lunge rep/leg; instruction separate from base targets                   |
| 7   | D                          | Easy                   | 4 rounds: 15 squats, 8–12 push-ups, 8 lunges/leg, 20 climbers, 15 bridges, 10 taps/side              |
| 8   | A volume                   | Easy                   | 4×10–15, 4×8–12, 3×12–15, 3×8–12, 3×40 sec                                                           |
| 9   | B volume                   | Easy                   | 4×20, 4×12/leg, 3×12, 3×15/leg, 4×25                                                                 |
| 10  | C foundation + progression | Intervals              | 1 min fast / 1 min easy within 3 km; pulls 4 sets; side plank 3×30 sec/side                          |
| 11  | Recovery                   | Very easy              | Mobility                                                                                             |
| 12  | Day 8 A                    | Easy                   | 3-sec lowering on final set of each push-up variation                                                |
| 13  | Day 9 B                    | Moderate               | Add wall sits 3×45–60 sec                                                                            |
| 14  | Day 7 D                    | Easy                   | 5 rounds                                                                                             |
| 15  | A strength                 | Easy                   | 4×12–18 push-ups; 4×8–12 pike; 3×8–12 diamond; 3×6–10 slow                                           |
| 16  | B strength                 | Easy                   | 4×20 slow squats; 4×12 lunges/leg; 4×10–15 split squats/leg; 4×15 bridges                            |
| 17  | C strength                 | Moderate               | 4 Y-T-W rounds; 4×15 snow angels/pulls; 3×15 crunches; 3×40 sec side plank                           |
| 18  | Recovery                   | Very easy              | Mobility                                                                                             |
| 19  | Day 15 A                   | Easy → moderate → hard | Progression across the 3 km                                                                          |
| 20  | Day 16 B                   | Easy                   | Add 4×25 calves and 3×60 sec wall sit                                                                |
| 21  | D strength                 | Easy                   | 5 rounds: 20 squats, 12 push-ups, 10 lunges/leg, 30 climbers, 20 bridges, 12 taps/side               |
| 22  | A peak                     | Easy                   | 5 push-up, 4 pike, 3 diamond, 3 slow sets; no rep numbers supplied                                   |
| 23  | B peak                     | Easy                   | 5×20 squats; 4×15 lunges/leg; 4×12–15 split squats; 4×15 bridges/leg                                 |
| 24  | C peak                     | Intervals              | 4 rounds + hollow hold 3×30–45 sec; see ambiguity below                                              |
| 25  | Recovery                   | Very easy              | Mobility only after run                                                                              |
| 26  | Day 22 A                   | Moderate               | Beat reps OR quality, not both                                                                       |
| 27  | Day 23 B + wall sits       | Easy                   | Make run very easy if legs unusually heavy; wall-sit dose unspecified                                |
| 28  | D peak                     | Easy                   | 5–6 controlled rounds; latest explicit circuit quantities carried from Day 21                        |
| 29  | Strength benchmark         | Easy                   | Maximum-quality push-up set; rest 3–4 min; 3×10 pike; 3×15 split squats/leg and pulls; maximum plank |
| 30  | Running benchmark          | 3 km time trial        | Warm up; compare previous 17–20 min range; no hard strength; walk 5–10 min + easy mobility           |

### Ambiguities and conservative interpretations

- Day 22/26 A has set counts only. Rep targets display **not specified**, rather than inventing ranges.
- Day 17 gives four Y-T-W rounds but no rep count; the UI says so.
- Day 24 “C: 4 rounds” does not define every exercise's count or hold duration. The actionable circuit uses the latest explicit C exercise selection (Day 17), labels its rep/hold omissions, and adds the explicit hollow hold. The full original C template remains available beside it. This is an interpretation, not a fabricated exact prescription.
- Day 27 wall-sit count and duration are unspecified. They remain unspecified.
- Repeated A/B sessions refer to that week's latest explicit version. Day 10 builds on the prior explicit C. Day 28 uses Day 21's latest explicit D circuit at the stated 5–6 rounds.
- Split squats / single-leg bridges retain the template's per-leg convention when abbreviated day rows omit “per leg.” This is marked where appropriate.
- The recovery template provides 20–30 minutes for abbreviated recovery rows. An optional fresh-only core circuit stays in the mobility instructions; no exercise or dose is invented.
- 12:00–12:30 **AM**, 2:00 **AM**, and 4:30–5:00 **AM** are intentional source times and have not been changed to PM.

### Dhruv meals and metrics

Every one of the 30 actual dates maps to the matching Monday–Sunday menu, including days 29–30. Tuesday, Thursday and Saturday always use the vegetarian rows. The data has 14 rotation slots (2 × 7). A missing start date intentionally produces no effective daily menu, rather than guessing a weekday. The generic nutrition guidance does not overwrite individual menus (for example, Friday chicken has no invented quantity).

Waist at navel: Days 1/8/15/22/30 reminders. Morning weight: several times per week. Run minutes, quality push-ups and plank seconds support benchmarks. Zero-valued measurements are accepted for inability to perform a benchmark; plausibility bounds are input validation, not fitness targets.

## Annanya

The 30-day calendar explicitly preserves its sequence even when Day 1 is not Monday.

| Week | A   | B   | Recovery | C   | Recovery | D   | Full rest |
| ---- | --- | --- | -------- | --- | -------- | --- | --------- |
| 1    | 1   | 2   | 3        | 4   | 5        | 6   | 7         |
| 2    | 8   | 9   | 10       | 11  | 12       | 13  | 14        |
| 3    | 15  | 16  | 17       | 18  | 19       | 20  | 21        |
| 4    | 22  | 23  | 24       | 25  | 26       | 27  | 28        |

Day 29 is the non-failure progress check + easy walk. Day 30 is easy walk, warm-up mobility, 10–15 minutes of gentle stretching, and reflection. No invented Week 5 step goal is applied.

| Week | Strength                            | Core                    | D conditioning                                                            | Step target                           |
| ---- | ----------------------------------- | ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| 1    | 2×8–10                              | 15–20 sec or 6/side     | 2 rounds: 30 sec march, 8 sit-to-stands, 30 sec light boxing; rest 60 sec | 3,000–4,000/day average               |
| 2    | 3×8–12                              | 20–25 sec or 8/side     | 3 rounds: 40 sec march, 10 sit-to-stands, 40 sec boxing; rest 60 sec      | 4,000–5,000/day average               |
| 3    | 3×10–15, ~3-sec lowering where safe | 25–35 sec or 10/side    | 3 rounds: 45 sec march, 12 sit-to-stands, 45 sec boxing; rest 45–60 sec   | 5,000–6,000/day average               |
| 4    | 3×12–15; selected 1–2-sec pauses    | 30–45 sec or 10–12/side | 4 rounds: 45 sec march, 12 sit-to-stands, 45 sec boxing; rest 45 sec      | Around 6,000+ only if ankle tolerates |

All 6 exercises in A/B/C, the 5 strength exercises plus conditioning in D, their individual rest times, dumbbell choices, modifications and cues were checked against pages 3–5. Repetition-based core means dead bug/bird dog; timed core means plank. The common weekly set count is applied to core; unilateral exercises are per side/leg. Those are structural interpretations of the shared progression table.

Warm-up and cooldown are individually trackable. Supported split squats can become chair squats; painful/unstable calf raises can become one extra set of glute bridges; marching can become seated fast punches. Two-leg bridge is the stated assisted-single-leg substitution. No replacement exercise has been invented. Ordinary recovery days do not specify a mobility duration, so none is invented.

### Meals, rest and check-ins

The menu is a flexible seven-day rotation. Interpretation: its Monday-labelled row is rotation Day 1 and repeats with program days, consistent with her calendar sequence. Days 29/30 continue rows 1/2. Unlike Dhruv, no actual-weekday dietary restriction exists. Four daily meal slots remain distinct; the general optional snack is a fifth optional slot. The Sunday-row pre-workout/snack is also optional. General alternatives are separate `meal_options`; “choose one” never implies eating all options.

Full-rest days require acknowledging full recovery. The weekly average step target remains visible but optional on these days, so the app does not force activity to receive rest-day adherence. Average steps uses **logged days**, with the denominator shown; missing days are not falsely treated as zero. Strength-session totals count only the 16 strength days. Recovery, benchmarks and meals are tracked separately.

Weekly energy and ankle comfort are 1–5 as written; no invented direction labels or extra health scales. Strength feeling and notes are text. Day 29 qualitative confidence/sleep/clothes-fit observations and Day 30 reflection use the task's actual/notes fields. Chair squat reps in 60 sec, clean push-ups, plank seconds, brisk-walk minutes and optional weight are available as measurements.

## Completion and streak semantics

A day is complete only when all non-optional session tasks and all non-optional meals are marked complete. Sets/reps/results are optional and do not override the source target. Both past and current due days can be logged; future days are read-only and rejected by the server and SQL trigger. A current unfinished day leaves yesterday's streak alive; an unfinished prior day breaks it. Full-rest/recovery days follow their actual scheduled requirements, not strength-session counts. After Day 30, the historical longest/current ending streak and all progress remain accessible; elapsed program time is never falsely presented as 100% adherence.

## Verification evidence

- Tests independently enumerate all 30 assignments for each person, check progression anchors, run/benchmark counts, relational references and unique IDs.
- Date tests cover 7 possible start weekdays × all 30 days for Dhruv meals, plus Annanya sequence invariance.
- PostgreSQL policy tests use the actual migration in PGlite, role switching, real constraints/triggers, and both directions of cross-profile denial.
- `db:verify` compares **every seeded field**, including all prescriptions, menus, options and source notes, with the authoritative structured source and verifies RLS on all 13 application tables.
- First-run records contain zero fabricated completion, measurements, streaks or check-ins.

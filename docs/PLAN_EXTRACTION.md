# PDF extraction and verification

The new `Updated_Workout_Plan.pdf` (8 pages) was read completely as text and rendered images. It supersedes Dhruv's old 7-page PDF wherever the definitions conflict. Annanya's original 9-page PDF and all her definitions are unchanged. The local PDFs are in `docs/source-pdfs/`; `dhruv-updated-source.txt` contains the new extraction. Current source notes include all 8 updated Dhruv pages and the original 9 Annanya pages. Uploaded PDF content is domain source material, not operational instructions.

## Domain mapping

`programs` identifies the source and meal basis. `program_days` holds 60 distinct days. `plan_tasks` holds independently trackable daily prescriptions; target text deliberately supports ranges, rounds, seconds, per-side counts and unspecified values without forcing false numeric precision. Instructions, cues, rest and source page are separate columns. `meal_slots` defines the rotation, `meal_options` preserves the alternatives, and `metric_definitions` restricts available measurements. Definitions are separate from all progress tables. No giant JSON plan payload is stored in PostgreSQL.

The source is maintained in `src/lib/plans.ts` and `src/lib/source-notes.ts`. Seed upserts deterministic IDs in a transaction and never writes tracking records or replaces Auth mappings/start dates. Editing the source then rerunning seed updates existing definitions; do not casually change IDs after tracking starts. Removing definitions requires an explicit reviewed migration, rather than a seed silently deleting historical rows.

## Dhruv

Training follows numbered days regardless of weekday. Every day has a 3 km run. Daily prescriptions take precedence over the broad templates on page 2: exercises absent from an explicit daily prescription are not silently added (for example, slow push-ups are absent from Week 1 A). The complete broad templates, including prone cobra holds, are retained in the Plan reference.

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
- Day 24 “C: 4 rounds” does not define every exercise's count or hold duration. The actionable circuit uses the latest explicit C exercise selection (Day 17), labels its rep/hold omissions, and adds the explicit hollow hold. The full updated C template remains available beside it. This is an interpretation, not a fabricated exact prescription.
- Day 27 wall-sit count and duration are unspecified. They remain unspecified.
- Repeated A/B sessions refer to that week's latest explicit version. Day 10 builds on the prior explicit C. Day 28 uses Day 21's latest explicit D circuit at the stated 5–6 rounds.
- Split squats / single-leg bridges retain the template's per-leg convention when abbreviated day rows omit “per leg.” This is marked where appropriate.
- The updated recovery template provides 20–30 minutes for abbreviated recovery rows. The old optional extra core circuit was removed. The new template specifies stationary split squats; the old Bulgarian variation was removed.
- New source pages: daily training rules/templates on p. 2, Days 1–28 on p. 3, benchmarks on p. 4. All 30 run types and strength/recovery prescriptions were compared against those pages. Existing task IDs, exercise order and recorded results remain stable. Abbreviated unilateral doses retain their existing per-leg interpretation.

### Dhruv meals and metrics

Each evening date maps to the matching Monday–Sunday menu, including Days 29–30. Tuesday, Thursday and Saturday training days are vegetarian. There are now 21 slots (3 × 7); absent start dates still produce no guessed effective menu. Old calorie/protein targets and unavailable foods were removed from the active nutrition definition. The new PDF gives a hard budget ceiling of ₹100–150/day and no numeric macro target.

| Evening weekday       | 11 PM Meal 1                          | 12:20–12:30 AM feeding      | 4 AM Meal 2                                             |
| --------------------- | ------------------------------------- | --------------------------- | ------------------------------------------------------- |
| Monday                | Vegetable masala oats + 2 eggs        | Banana-milk shake           | Egg-vegetable toast + 2 sausages + fruit                |
| Tuesday · vegetarian  | Peanut-butter banana oats + fruit     | Banana-milk shake           | Crunchy vegetable peanut-butter sandwich + milk + fruit |
| Wednesday             | Vegetable omelette toast + fruit      | Banana-milk shake           | Masala oats + 4 eggs + cucumber/tomato                  |
| Thursday · vegetarian | Fruit oatmeal + peanut butter         | Banana OR banana-milk shake | Vegetable toast sandwiches + milk + fruit               |
| Friday                | Egg-vegetable scramble toast + banana | Banana-milk shake           | Sausage-vegetable skillet + bread + fruit               |
| Saturday · vegetarian | Peanut-butter banana oatmeal + fruit  | Banana-milk shake           | Savory vegetable oats + milk + fruit                    |
| Sunday                | Masala oats + 2 eggs + fruit          | Banana-milk shake           | Egg & sausage vegetable sandwich + fruit                |

All seven rows were checked against p. 5, including each side. The 12:20–12:30 range follows the more precise routine on p. 2; the table labels the same event 12:20 AM. Milk heaviness alternatives on p. 2 (banana alone or small toast) and the optional-oats alternative on p. 6 are guidance, not mandatory changes.

### Overnight dates

The program's date is `start_date + program_day - 1`, interpreted as the date of the **11 PM evening meal**. `day_offset` is 0 for Meal 1 and 1 for the snack and Meal 2. All completion writes retain the original `day` and meal ID. Real weekday means the anchored evening weekday, not the weekday at the moment a checkbox is clicked. This avoids changing menus mid-session. For example, Monday night and the following Tuesday's 12:20/4 AM events use Monday's row; Tuesday night's row is vegetarian. This interpretation reconciles the single training day with the PDF's weekday rotation.

Today changes at **5 AM for Dhruv**, immediately after the PDF's 4:20–5 AM wind-down and before sleep; this is an explicit application convention, not a cutoff prescribed by the PDF. Annanya changes at midnight. `trainingDate()` in TypeScript and `training_date()` in PostgreSQL subtract five _local wall-clock_ hours for Dhruv only. Actions, due-day constraints, start-date selection, Today routes and partner summaries use the same convention. Tests include midnight, 12:20, 12:30, 1 AM, 4 AM, 4:59:59 and 5 AM, as well as month/year/leap-day and DST cases.

### Recipes connected to daily meals

`src/lib/recipes.ts` contains 10 recipe definitions, independently queryable ordered ingredient rows, 40 ordered step rows, and 20 meal-to-recipe links. They seed relational `recipes`, `recipe_ingredients`, `recipe_steps`, and `meal_recipe_links`. Optional notes, quantities, units and ingredient variants remain separate fields. No recipe or ingredient is a progress target. Linked recipes are reused each week; a meal supports zero or multiple links. All complete meal prescriptions (including eggs, fruit, milk, bread, cucumber/tomato and sausages) remain on the meal card and at the top of the sheet.

The selected day's meal IDs restrict one nested Supabase query; steps/ingredients are sorted after loading. No full-library or per-recipe fetch occurs. Ingredient checks are local state that resets when the native dialog closes; peer/future/preview checks are disabled. Completion invokes the existing meal server action and owner-only RLS upsert. The sheet reports saving/failure and confirms success from refreshed persisted data.

### Recipe-by-recipe audit against pages 6–7

Every name, quantity, ingredient group/option, all four preparation steps and source notes were checked against the rendered PDF. Quantities use typographic en dashes in the UI; wording and values are unchanged. Blank quantities deliberately remain unspecified. No serving count is fabricated.

| Recipe                                                      | Quantity/ingredient check                                                                                                                    | Steps and notes checked                                                                                            | Daily mapping                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Vegetable Masala Oats · p. 6                                | 70–80 g oats; ½ onion; 1 tomato; handful chopped carrot/cabbage/spinach; 250–300 ml water; salt, pepper, chilli/turmeric or preferred spices | Chop; vegetables/water/spices 3–4 min; oats simmer 3–5 min; extra water if needed, 2–4 cooked eggs on non-veg days | Mon Meal 1 (2 eggs), Wed Meal 2 (4 eggs + cucumber/tomato), Sun Meal 1 (2 eggs + fruit) |
| Peanut-Butter Banana Oatmeal · p. 6                         | 70–90 g oats; 250–300 ml milk; 1 banana; 15–25 g PB                                                                                          | Low-heat cook or soak; slice/mash banana; PB off heat; keep PB moderate                                            | Tue/Sat Meal 1, preserving fruit                                                        |
| Banana-Milk Pre-workout Shake · p. 6                        | 1 banana; 200–250 ml milk; optional 10–15 g oats if tolerated                                                                                | Blender; blend; 12:20–12:30 AM; remove oats or banana alone if heavy; p. 2 small-toast alternative also included   | All seven snacks; Thu banana-alone choice preserved                                     |
| Vegetable Omelette Toast · p. 6                             | 2–4 eggs; 2–4 bread slices; chopped onion/tomato/capsicum or spinach; salt/pepper/spices                                                     | Beat; add vegetables; cook fully set, flip if needed; toast + sliced cucumber/tomato                               | Wed Meal 1 and Mon egg-vegetable toast; Monday retains 2 sausages + fruit               |
| Egg-Vegetable Scramble · p. 6                               | 3–4 eggs; onion; tomato; capsicum/spinach/cabbage; spices; 2–4 bread slices                                                                  | Non-stick vegetables + splash water if needed; beaten eggs; gently stir fully cooked; season/bread                 | Fri Meal 1, preserving banana                                                           |
| Sausage-Vegetable Skillet · p. 6                            | 2 chicken sausages; onion; tomato; capsicum/cabbage; spices; 2–4 bread slices                                                                | Package cooking instructions; slice; vegetables/same pan/return sausage; bread, sausages supplementary             | Fri Meal 2, preserving bread + fruit                                                    |
| Egg & Sausage Vegetable Sandwich · pp. 6–7                  | 2 eggs; 1–2 cooked chicken sausages; 4 bread slices; tomato, cucumber/onion/capsicum; spices                                                 | Cook safely; slice; layer; optional dry-pan toast + fruit                                                          | Sun Meal 2                                                                              |
| Crunchy Vegetable Peanut-Butter Sandwich · p. 7, vegetarian | 4 bread slices; 20–30 g PB; thin cucumber/carrot; banana or other fruit on side                                                              | Optional toast; thin measured PB; vegetable crunch; close + fruit/milk                                             | Tue Meal 2                                                                              |
| Savory Vegetable Oats · p. 7, vegetarian                    | 80–100 g oats; onion; tomato; carrot/cabbage/spinach; spices; water                                                                          | Chop; cook vegetables/spices/water; oats/water to texture; simmer + milk/fruit separately                          | Sat Meal 2                                                                              |
| Fruit Oat Bowl · p. 7                                       | 70–90 g oats; 250–300 ml milk; 1 serving banana/guava/orange/papaya/apple; optional 15–20 g PB if needed                                     | Oats/milk; fruit after slight cooling; PB only if calories/budget allow; seasonal fruit                            | Thu Meal 1 (fruit oatmeal + PB); optional PB guidance retained                          |

Mapping interpretations are explicit: “fruit oatmeal” is the supplied Fruit Oat Bowl; Monday's “egg-vegetable toast” uses the supplied Vegetable Omelette Toast method. Thursday's “vegetable toast sandwiches” has no exact recipe in the PDF. It therefore has **no recipe link**, a visible explanation, and its unchanged complete meal; we do not silently make it a peanut-butter sandwich or invent steps.

### Shopping, routine and tracking audit

All six shopping/preparation bullets on p. 8 are separate kitchen notes displayed under Meal Prep Guide: seasonal price-based produce; bananas; 1–2 day batch chopping only with safe refrigeration; package sausage storage/cooking and avoiding prolonged unrefrigerated milk/cooked eggs/sausage; seasoning/sodium; water and no need for juice/sports drinks/protein powder. The full p. 5 budget framework and p. 8 tracking/safety guidance remain in authenticated source reference notes. No additional food-safety time or temperature claims are added.

The complete p. 2 routine is retained: sleep 5 AM–1 PM; wake/water/sunlight 1–1:30 PM; DSA 2–4 and 4:20–6:20 PM; development 6:40–8:40 and 9–11 PM; three feeding events; digest/hydrate/warm up 12:30–1 AM; training 1–3 AM; shower/recovery 3–4 AM; wind-down 4:20–5 AM. Active UI timing reflects this routine.

### Migration and seed safety

`002_meal_prep.sql` adds four definition tables and three meal metadata columns. It moves old Dhruv Meal 2 to position 3 **without changing its ID**. New snack IDs are `dhruv-meal-{weekday}-snack`; neither old completion is reused as a snack. No tracking row is deleted, rewritten or reset. The ledger applies the migration once. Shared seed statements are tested by running them twice against actual PostgreSQL; every definition remains identical. Old personal results/notes/completions/measurements, profile dates and account IDs are compared before/after migration in regression tests. Existing two-meal completions stay 2/3 after the update; no historical snack completion is invented.

Annanya's complete prior structured definition is frozen in a test fixture and compared field by field (new empty meal metadata excluded). Her recipes remain absent, her meals optionality and sequence are unchanged, and her date rollover remains midnight.

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
- `db:verify` compares **every seeded field**, including all prescriptions, menus, options and source notes, with the authoritative structured source and verifies RLS on all 17 application tables.
- First-run records contain zero fabricated completion, measurements, streaks or check-ins.

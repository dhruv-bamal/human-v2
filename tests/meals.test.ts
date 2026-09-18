import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { plan } from "../src/lib/plans";
import { recipeData } from "../src/lib/recipes";
import {
  addDays,
  trainingDate,
  rotationDay,
  programStatus,
  canEditDay,
} from "../src/lib/dates";
import { daySummary } from "../src/lib/domain";
import { PGlite } from "@electric-sql/pglite";
import { seedGroups, seedStatements } from "../scripts/seed-data";

test("all pre-existing Annanya definitions remain identical; no invented recipes", async () => {
  const baseline = JSON.parse(
    await readFile("tests/fixtures/annanya-plan.json", "utf8"),
  );
  for (const [key, expected] of Object.entries(baseline)) {
    const actual = plan[key as keyof typeof plan].filter(
      (row) =>
        ("person" in row && row.person === "annanya") ||
        ("id" in row && row.id === "annanya"),
    );
    // Project onto the original fields to exclude newly added, empty meal metadata.
    assert.deepEqual(
      actual.map((row, i) =>
        Object.fromEntries(
          Object.keys((expected as Record<string, unknown>[])[i]).map((k) => [
            k,
            row[k as keyof typeof row],
          ]),
        ),
      ),
      expected,
      key,
    );
  }
  assert(!recipeData.links.some((l) => l.slot_id.startsWith("annanya")));
  assert.equal(plan.meals.filter((m) => m.person === "annanya").length, 35);
});

test("every weekday menu, side and recipe link matches updated PDF rotation", () => {
  const expected = [
    [
      "Vegetable masala oats + 2 eggs",
      "Banana-milk shake",
      "Egg-vegetable toast + 2 sausages + fruit",
    ],
    [
      "Peanut-butter banana oats + fruit",
      "Banana-milk shake",
      "Crunchy vegetable peanut-butter sandwich + milk + fruit",
    ],
    [
      "Vegetable omelette toast + fruit",
      "Banana-milk shake",
      "Masala oats + 4 eggs + cucumber/tomato",
    ],
    [
      "Fruit oatmeal + peanut butter",
      "Banana OR banana-milk shake",
      "Vegetable toast sandwiches + milk + fruit",
    ],
    [
      "Egg-vegetable scramble toast + banana",
      "Banana-milk shake",
      "Sausage-vegetable skillet + bread + fruit",
    ],
    [
      "Peanut-butter banana oatmeal + fruit",
      "Banana-milk shake",
      "Savory vegetable oats + milk + fruit",
    ],
    [
      "Masala oats + 2 eggs + fruit",
      "Banana-milk shake",
      "Egg & sausage vegetable sandwich + fruit",
    ],
  ];
  const links = [
    ["vegetable-masala-oats", "banana-milk-shake", "vegetable-omelette-toast"],
    ["pb-banana-oatmeal", "banana-milk-shake", "vegetable-pb-sandwich"],
    ["vegetable-omelette-toast", "banana-milk-shake", "vegetable-masala-oats"],
    ["fruit-oat-bowl", "banana-milk-shake", null],
    [
      "egg-vegetable-scramble",
      "banana-milk-shake",
      "sausage-vegetable-skillet",
    ],
    ["pb-banana-oatmeal", "banana-milk-shake", "savory-vegetable-oats"],
    ["vegetable-masala-oats", "banana-milk-shake", "egg-sausage-sandwich"],
  ];
  for (let day = 1; day <= 7; day++) {
    const meals = plan.meals
      .filter((m) => m.person === "dhruv" && m.rotation_day === day)
      .sort((a, b) => a.position - b.position);
    assert.deepEqual(
      meals.map((m) => m.menu),
      expected[day - 1],
    );
    assert.deepEqual(
      meals.map((m) => m.timing),
      ["11:00 PM", "12:20–12:30 AM", "4:00 AM"],
    );
    assert.deepEqual(
      meals.map((m) => m.day_offset),
      [0, 1, 1],
    );
    assert.deepEqual(
      meals.map((m) => m.id),
      [`dhruv-meal-${day}-1`, `dhruv-meal-${day}-snack`, `dhruv-meal-${day}-2`],
    );
    assert.deepEqual(
      meals.map(
        (m) =>
          recipeData.links.find((l) => l.slot_id === m.id)?.recipe_id || null,
      ),
      links[day - 1],
    );
    if ([2, 4, 6].includes(day)) {
      assert(
        meals.every(
          (m) => m.vegetarian && !/egg|sausage|chicken/i.test(m.menu),
        ),
      );
      const attached = recipeData.links.filter((l) =>
        meals.some((m) => m.id === l.slot_id),
      );
      assert(
        attached.every(
          (l) =>
            recipeData.recipes.find((r) => r.id === l.recipe_id)!.vegetarian,
        ),
      );
      assert(
        recipeData.ingredients
          .filter((i) => attached.some((l) => l.recipe_id === i.recipe_id))
          .every((i) => !/egg|sausage|chicken/i.test(i.ingredient_name)),
      );
    }
  }
  assert.equal(recipeData.recipes.length, 10);
  assert.equal(recipeData.steps.length, 40);
  for (const recipe of recipeData.recipes) {
    const ingredients = recipeData.ingredients.filter(
      (i) => i.recipe_id === recipe.id,
    );
    assert(ingredients.length > 0);
    assert.deepEqual(
      ingredients.map((i) => i.position),
      ingredients.map((_, i) => i + 1),
    );
    assert.deepEqual(
      recipeData.steps
        .filter((s) => s.recipe_id === recipe.id)
        .map((s) => s.step_number),
      [1, 2, 3, 4],
    );
  }
  const optional = recipeData.ingredients.filter((i) => i.optional);
  assert.deepEqual(
    optional.map((i) => [i.recipe_id, i.ingredient_name, i.quantity]),
    [
      ["banana-milk-shake", "oats", "10–15"],
      ["fruit-oat-bowl", "peanut butter", "15–20"],
    ],
  );
});

test("one evening training day survives midnight, snack, workout and post-workout; Annanya stays on calendar date", () => {
  const evening = "2026-09-14"; // Monday, regardless of program Day 1's weekday.
  for (const time of [
    "2026-09-14T23:00:00+05:30",
    "2026-09-15T00:20:00+05:30",
    "2026-09-15T00:30:00+05:30",
    "2026-09-15T01:00:00+05:30",
    "2026-09-15T04:00:00+05:30",
    "2026-09-15T04:59:59+05:30",
  ]) {
    const today = trainingDate("dhruv", new Date(time));
    assert.equal(today, evening);
    const day = programStatus(evening, today).day;
    assert.equal(day, 1);
    assert.equal(rotationDay("dhruv", day, evening), 1);
    assert(!canEditDay(evening, 2, today));
  }
  assert.equal(
    trainingDate("dhruv", new Date("2026-09-15T05:00:00+05:30")),
    "2026-09-15",
  );
  assert.equal(
    trainingDate("annanya", new Date("2026-09-15T00:00:00+05:30")),
    "2026-09-15",
  );
  assert.equal(
    trainingDate("dhruv", new Date("2028-03-01T04:00:00+05:30")),
    "2028-02-29",
  );
  assert.equal(
    trainingDate("dhruv", new Date("2027-01-01T04:00:00+05:30")),
    "2026-12-31",
  );
  for (const instant of [
    "2026-03-08T03:30:00-04:00",
    "2026-11-01T01:30:00-05:00",
  ])
    assert.equal(
      trainingDate("dhruv", new Date(instant), "America/New_York"),
      addDays(instant.slice(0, 10), -1),
    );
});

test("meal progress denominator is three, and two old meal completions never complete the new snack", () => {
  const profile = {
    id: "dhruv" as const,
    auth_user_id: "d",
    start_date: "2026-09-14",
  };
  const progress = {
    taskProgress: [],
    mealProgress: ["1", "2"].map((slot) => ({
      person: "dhruv" as const,
      day: 1,
      slot_id: `dhruv-meal-1-${slot}`,
      completed: true,
      notes: "kept",
      updated_at: "2026-09-15T00:00:00Z",
    })),
    measurements: [],
    checkins: [],
  };
  const summary = daySummary(plan, progress, profile, 1, "2026-09-14");
  assert.equal(summary.meals, 3);
  assert.equal(summary.mealDone, 2);
  assert(!summary.complete);
});

test("additive migration, actual seed twice, history preservation, recipe privacy and owner-only meal writes", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to authenticated;`,
    );
    await db.exec(
      await readFile("supabase/migrations/001_initial.sql", "utf8"),
    );
    await db.exec(`insert into programs values('dhruv','Dhruv','goal','weekday','old'),('annanya','Annanya','goal','sequence','old');
   insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
   insert into profiles(id,auth_user_id,start_date) values('dhruv','11111111-1111-4111-8111-111111111111','2020-01-06'),('annanya','22222222-2222-4222-8222-222222222222','2020-01-06');
   insert into program_days values('dhruv',1,1,'old','focus','strength','',4),('annanya',1,1,'old','focus','strength','',6);
   insert into plan_tasks values('dhruv-1-1','dhruv',1,1,'Warm-up','5–7 min','warmup','','',false,4);
   insert into meal_slots values('dhruv-meal-1-1','dhruv',1,1,'Meal 1','old pre',false,''),('dhruv-meal-1-2','dhruv',1,2,'Meal 2','old post',false,'');
   insert into metric_definitions values('dhruv','weight','Weight','kg',0,500);
   insert into task_progress(person,day,task_id,completed,actual,notes) values('dhruv',1,'dhruv-1-1',true,'old results','old task notes');
   insert into meal_progress(person,day,slot_id,completed,notes) values('dhruv',1,'dhruv-meal-1-2',true,'old meal notes');
   insert into measurements(person,day,metric,value) values('dhruv',1,'weight',80);
   insert into weekly_checkins(person,week,energy,notes) values('annanya',1,4,'old weekly notes');`);
    const history = [
      "profiles",
      "task_progress",
      "meal_progress",
      "measurements",
      "weekly_checkins",
    ];
    const before = await Promise.all(
      history.map((t) => db.query(`select * from ${t} order by 1,2`)),
    );
    await db.exec(
      await readFile("supabase/migrations/002_meal_prep.sql", "utf8"),
    );
    for (const s of seedStatements()) await db.query(s.text, s.values);
    const once = await Promise.all(
      seedGroups.map(([t]) => db.query(`select * from ${t} order by 1,2`)),
    );
    for (const s of seedStatements()) await db.query(s.text, s.values);
    const twice = await Promise.all(
      seedGroups.map(([t]) => db.query(`select * from ${t} order by 1,2`)),
    );
    assert.deepEqual(
      twice,
      once,
      "every seeded field remains identical after rerun",
    );
    assert.deepEqual(
      await Promise.all(
        history.map((t) => db.query(`select * from ${t} order by 1,2`)),
      ),
      before,
      "all original progress, notes, results, dates and auth links preserved",
    );
    for (const time of [
      "2026-09-14T23:00:00+05:30",
      "2026-09-15T00:20:00+05:30",
      "2026-09-15T04:00:00+05:30",
      "2026-09-15T05:00:00+05:30",
    ]) {
      for (const person of ["dhruv", "annanya"] as const) {
        const result = await db.query<{ day: string }>(
          `select public.training_date($1,$2)::text as day`,
          [person, time],
        );
        assert.equal(result.rows[0].day, trainingDate(person, new Date(time)));
      }
    }
    async function asUser(id: string) {
      await db.exec("reset role");
      await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
        id,
      ]);
      await db.exec("set role authenticated");
    }
    await asUser("11111111-1111-4111-8111-111111111111");
    await db.query(
      `insert into meal_progress(person,day,slot_id,completed) values('dhruv',1,'dhruv-meal-1-snack',true)`,
    );
    assert.equal(
      (
        await db.query<{ completed: boolean }>(
          `select completed from meal_progress where slot_id='dhruv-meal-1-snack'`,
        )
      ).rows[0].completed,
      true,
    );
    await asUser("22222222-2222-4222-8222-222222222222");
    assert.equal((await db.query(`select * from recipes`)).rows.length, 10);
    assert.equal(
      (await db.query(`select * from recipe_steps`)).rows.length,
      40,
    );
    assert.equal(
      (
        await db.query(
          `update meal_progress set completed=false where person='dhruv' returning person`,
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        `insert into meal_progress(person,day,slot_id) values('dhruv',1,'dhruv-meal-1-1')`,
      ),
    );
    for (const table of [
      "recipes",
      "recipe_ingredients",
      "recipe_steps",
      "meal_recipe_links",
    ])
      await assert.rejects(db.query(`delete from ${table}`));
    await asUser("33333333-3333-4333-8333-333333333333");
    assert.equal((await db.query(`select * from recipes`)).rows.length, 0);
    await db.exec("reset role;set role anon");
    await assert.rejects(db.query("select * from recipes"));
  } finally {
    await db.close();
  }
});

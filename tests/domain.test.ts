import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateInZone,
  addDays,
  programStatus,
  rotationDay,
  canEditDay,
  validDate,
} from "../src/lib/dates";
import { ownsProfile, mayWrite, daySummary, overall } from "../src/lib/domain";
import { plan } from "../src/lib/plans";
import type { Profile, ProgressData, Person } from "../src/lib/types";
const profiles: Record<Person, Profile> = {
  dhruv: { id: "dhruv", auth_user_id: "d-auth", start_date: "2026-09-18" },
  annanya: { id: "annanya", auth_user_id: "a-auth", start_date: "2026-09-18" },
};
const empty: ProgressData = {
  taskProgress: [],
  mealProgress: [],
  measurements: [],
  checkins: [],
};
test("owners can edit their due days; neither can edit the other profile", () => {
  assert(ownsProfile("d-auth", profiles.dhruv));
  assert(ownsProfile("a-auth", profiles.annanya));
  assert(!ownsProfile("d-auth", profiles.annanya));
  assert(!ownsProfile("a-auth", profiles.dhruv));
  assert(!ownsProfile("", profiles.dhruv));
  assert(mayWrite("d-auth", profiles.dhruv, 1, "2026-09-18"));
  assert(!mayWrite("d-auth", profiles.dhruv, 2, "2026-09-18"));
});
test("start, Day 1, Day 30, before and after program; timezone midnight", () => {
  assert.deepEqual(programStatus(null, "2026-09-18"), {
    state: "not_started",
    day: 1,
    elapsed: 0,
  });
  assert.equal(programStatus("2026-09-18", "2026-09-17").state, "not_started");
  assert.equal(programStatus("2026-09-18", "2026-09-18").day, 1);
  assert.equal(programStatus("2026-09-18", "2026-10-17").day, 30);
  assert.equal(programStatus("2026-09-18", "2026-10-17").state, "active");
  assert.equal(programStatus("2026-09-18", "2026-10-18").state, "completed");
  assert.equal(
    dateInZone(new Date("2026-09-17T18:29:59Z"), "Asia/Kolkata"),
    "2026-09-17",
  );
  assert.equal(
    dateInZone(new Date("2026-09-17T18:30:00Z"), "Asia/Kolkata"),
    "2026-09-18",
  );
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert(!validDate("2026-02-30"));
  assert(!canEditDay(null, 1, "2026-09-18"));
});
test("every start weekday preserves actual Tue/Thu/Sat vegetarian menus over all 30 days", () => {
  for (let offset = 0; offset < 7; offset++)
    for (let day = 1; day <= 30; day++) {
      const start = addDays("2026-09-14", offset),
        rotation = rotationDay("dhruv", day, start)!;
      const actual =
        new Date(addDays(start, day - 1) + "T12:00:00Z").getUTCDay() || 7;
      assert.equal(rotation, actual);
      const meals = plan.meals.filter(
        (m) => m.person === "dhruv" && m.rotation_day === rotation,
      );
      assert.equal(meals.length, 2);
      if ([2, 4, 6].includes(actual))
        assert(meals.every((m) => !/(eggs|chicken)/i.test(m.menu)));
      assert.equal(rotationDay("annanya", day, start), ((day - 1) % 7) + 1);
    }
  assert.equal(rotationDay("dhruv", 1, null), null);
});
test("all 60 days, required relations, exercise ordering and benchmark days", () => {
  for (const person of ["dhruv", "annanya"] as const) {
    const days = plan.days.filter((d) => d.person === person);
    assert.equal(days.length, 30);
    assert.equal(new Set(days.map((d) => d.day)).size, 30);
    for (const d of days) {
      const tasks = plan.tasks.filter(
        (t) => t.person === person && t.day === d.day,
      );
      assert(tasks.length > 0);
      assert(tasks.every((t) => t.name && t.target));
      assert.equal(new Set(tasks.map((t) => t.position)).size, tasks.length);
    }
  }
  assert.equal(new Set(plan.tasks.map((t) => t.id)).size, plan.tasks.length);
  assert(plan.options.every((o) => plan.meals.some((m) => m.id === o.slot_id)));
  assert.equal(
    plan.tasks.filter((t) => t.person === "dhruv" && t.kind === "run").length,
    30,
  );
  assert.equal(
    plan.days.filter((d) => d.person === "annanya" && d.kind === "strength")
      .length,
    16,
  );
  assert.equal(
    plan.days.find((d) => d.person === "dhruv" && d.day === 29)?.kind,
    "benchmark",
  );
  assert.equal(
    plan.days.find((d) => d.person === "dhruv" && d.day === 30)?.kind,
    "benchmark",
  );
  assert.equal(
    plan.days.find((d) => d.person === "annanya" && d.day === 29)?.kind,
    "benchmark",
  );
  assert(
    plan.tasks.some(
      (t) => t.person === "annanya" && t.day === 30 && t.kind === "reflection",
    ),
  );
});
test("complete day-by-day schedule matches PDF calendar and all 4 weekly prescriptions", () => {
  const dhruv = [
    "A",
    "B",
    "C",
    "Recovery",
    "A",
    "B",
    "D",
    "A",
    "B",
    "C",
    "Recovery",
    "A",
    "B",
    "D",
    "A",
    "B",
    "C",
    "Recovery",
    "A",
    "B",
    "D",
    "A",
    "B",
    "C",
    "Recovery",
    "A",
    "B",
    "D",
    "Strength benchmark",
    "Running benchmark",
  ];
  const annanya = Array(4)
    .fill([
      "Workout A",
      "Workout B",
      "Recovery + steps",
      "Workout C",
      "Recovery + steps",
      "Workout D",
      "Full rest",
    ])
    .flat()
    .concat(["Progress check", "Mobility & reflection"]);
  assert.deepEqual(
    plan.days.filter((d) => d.person === "dhruv").map((d) => d.title),
    dhruv.map((d) =>
      d.length === 1
        ? "Workout " + d
        : d === "Recovery"
          ? "Mobility & recovery"
          : d,
    ),
  );
  assert.deepEqual(
    plan.days.filter((d) => d.person === "annanya").map((d) => d.title),
    annanya,
  );
  for (const [day, target] of [
    [1, "2 × 8–10"],
    [8, "3 × 8–12"],
    [15, "3 × 10–15"],
    [22, "3 × 12–15"],
  ] as const)
    assert.equal(
      plan.tasks.find(
        (t) =>
          t.person === "annanya" &&
          t.day === day &&
          t.name === "Dumbbell floor press",
      )?.target,
      target,
    );
  for (const [day, target] of [
    [6, "2 rounds"],
    [13, "3 rounds"],
    [20, "3 rounds"],
    [27, "4 rounds"],
  ] as const)
    assert.equal(
      plan.tasks.find(
        (t) =>
          t.person === "annanya" && t.day === day && t.kind === "conditioning",
      )?.target,
      target,
    );
  assert.equal(
    plan.tasks.find(
      (t) => t.person === "dhruv" && t.day === 15 && t.name === "Push-ups",
    )?.target,
    "4 × 12–18",
  );
  assert.equal(
    plan.tasks.find(
      (t) => t.person === "dhruv" && t.day === 22 && t.name === "Push-ups",
    )?.target,
    "5 sets",
  );
});
function finished(person: Person, day: number): ProgressData {
  const rotation = rotationDay(person, day, profiles[person].start_date);
  const now = "2026-10-20T00:00:00Z";
  return {
    ...empty,
    taskProgress: plan.tasks
      .filter((t) => t.person === person && t.day === day && !t.optional)
      .map((t) => ({
        person,
        day,
        task_id: t.id,
        completed: true,
        actual: "",
        notes: "",
        updated_at: now,
      })),
    mealProgress: plan.meals
      .filter(
        (m) =>
          m.person === person && m.rotation_day === rotation && !m.optional,
      )
      .map((m) => ({
        person,
        day,
        slot_id: m.id,
        completed: true,
        notes: "",
        updated_at: now,
      })),
  };
}
test("exercise and meal completion; optional snacks and rest/steps semantics", () => {
  const p = finished("annanya", 7);
  const summary = daySummary(plan, p, profiles.annanya, 7, "2026-10-20");
  assert(summary.complete);
  assert.equal(summary.tasks, 1);
  assert.equal(summary.meals, 3);
  const total = overall(plan, p, profiles.annanya, "2026-10-20");
  assert.equal(total.workouts, 0);
  assert.equal(total.recovery, 1);
  p.mealProgress.pop();
  assert(!daySummary(plan, p, profiles.annanya, 7, "2026-10-20").complete);
  assert(
    !daySummary(plan, finished("dhruv", 2), profiles.dhruv, 2, "2026-09-18")
      .complete,
  );
  assert(
    daySummary(plan, finished("dhruv", 4), profiles.dhruv, 4, "2026-10-20")
      .complete,
  );
});
test("streak includes rest/recovery and leaves unfinished current day open", () => {
  const p = finished("annanya", 6),
    rest = finished("annanya", 7);
  p.taskProgress.push(...rest.taskProgress);
  p.mealProgress.push(...rest.mealProgress);
  assert.equal(overall(plan, p, profiles.annanya, "2026-09-25").streak, 2);
  assert.equal(overall(plan, p, profiles.annanya, "2026-09-26").streak, 0);
  assert.equal(overall(plan, p, profiles.annanya, "2026-09-26").longest, 2);
});

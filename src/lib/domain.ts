import { canEditDay, rotationDay, programStatus } from "./dates";
import type { PlanData, ProgressData, Profile } from "./types";
export function ownsProfile(userId: string, profile: Profile) {
  return !!userId && userId === profile.auth_user_id;
}
export function mayWrite(
  userId: string,
  profile: Profile,
  day: number,
  today: string,
) {
  return (
    ownsProfile(userId, profile) && canEditDay(profile.start_date, day, today)
  );
}
export function daySummary(
  plan: PlanData,
  progress: ProgressData,
  profile: Profile,
  day: number,
  today: string,
) {
  const tasks = plan.tasks.filter(
    (t) => t.person === profile.id && t.day === day && !t.optional,
  );
  const rotation = rotationDay(profile.id, day, profile.start_date);
  const meals = plan.meals.filter(
    (m) =>
      m.person === profile.id && m.rotation_day === rotation && !m.optional,
  );
  const eligible = canEditDay(profile.start_date, day, today);
  const taskDone = eligible
    ? tasks.filter((t) =>
        progress.taskProgress.some(
          (p) =>
            p.person === profile.id &&
            p.day === day &&
            p.task_id === t.id &&
            p.completed,
        ),
      ).length
    : 0;
  const mealDone = eligible
    ? meals.filter((m) =>
        progress.mealProgress.some(
          (p) =>
            p.person === profile.id &&
            p.day === day &&
            p.slot_id === m.id &&
            p.completed,
        ),
      ).length
    : 0;
  return {
    tasks: tasks.length,
    taskDone,
    meals: meals.length,
    mealDone,
    workoutDone: eligible && tasks.length > 0 && taskDone === tasks.length,
    complete:
      eligible &&
      tasks.length > 0 &&
      meals.length > 0 &&
      taskDone === tasks.length &&
      mealDone === meals.length,
    started: taskDone + mealDone > 0,
    eligible,
  };
}
export function overall(
  plan: PlanData,
  progress: ProgressData,
  profile: Profile,
  today: string,
) {
  const rows = Array.from({ length: 30 }, (_, i) =>
    daySummary(plan, progress, profile, i + 1, today),
  );
  const completed = rows.filter((r) => r.complete).length;
  let longest = 0,
    run = 0;
  for (const row of rows) {
    run = row.complete ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const status = programStatus(profile.start_date, today);
  let idx = Math.min(status.elapsed, 30) - 1;
  if (idx >= 0 && !rows[idx].complete && status.elapsed <= 30) idx--;
  let streak = 0;
  while (idx >= 0 && rows[idx].complete) {
    streak++;
    idx--;
  }
  const strength = plan.days.filter(
    (d) => d.person === profile.id && d.kind === "strength",
  );
  return {
    rows,
    completed,
    percent: Math.round((completed / 30) * 100),
    longest,
    streak,
    workouts: strength.filter((d) => rows[d.day - 1].workoutDone).length,
    workoutTotal: strength.length,
    meals: rows.reduce((s, r) => s + r.mealDone, 0),
    runs: plan.tasks.filter(
      (t) =>
        t.person === profile.id &&
        t.kind === "run" &&
        rows[t.day - 1].eligible &&
        progress.taskProgress.some((p) => p.task_id === t.id && p.completed),
    ).length,
    recovery: plan.days.filter(
      (d) =>
        d.person === profile.id &&
        (d.kind === "recovery" || d.kind === "rest") &&
        rows[d.day - 1].workoutDone,
    ).length,
  };
}

import "server-only";
import { requireMember } from "./auth";
import { dateInZone } from "./dates";
import type { PlanData, ProgressData, Profile, Person } from "./types";
export async function loadDashboard(
  person?: Person,
  view = "overview",
  selectedDay?: number,
) {
  const { db, profile: viewer } = await requireMember();
  const queries = await Promise.all([
    db.from("profiles").select("id,auth_user_id,start_date"),
    db.from("programs").select("*"),
    db.from("program_days").select("*").order("day"),
    // Full prescriptions only for the selected profile; the peer needs lightweight task metadata for totals.
    db.from("plan_tasks").select("id,person,day,position,kind,optional"),
    db
      .from("plan_tasks")
      .select("*")
      .eq("person", person || viewer.id)
      .eq("day", selectedDay || 1)
      .order("position"),
    db.from("meal_slots").select("*").order("position"),
    db.from("meal_options").select("*").order("position"),
    db
      .from("program_notes")
      .select("*")
      .eq("person", person || viewer.id),
    db.from("metric_definitions").select("*"),
    db.from("task_progress").select("*"),
    db.from("meal_progress").select("*"),
    db.from("measurements").select("*").order("day"),
    db.from("weekly_checkins").select("*"),
    db.from("app_settings").select("timezone").single(),
  ]);
  if (queries.some((q) => q.error))
    throw new Error("Your tracker could not be loaded.");
  const [
    profiles,
    programs,
    days,
    taskMeta,
    dayTasks,
    meals,
    options,
    notes,
    metrics,
    taskProgress,
    mealProgress,
    measurements,
    checkins,
    settings,
  ] = queries.map((q) => q.data);
  const zone = (settings as { timezone: string }).timezone;
  if (zone !== (process.env.APP_TIMEZONE || "Asia/Kolkata"))
    throw new Error(
      "Application timezone configuration differs from the database.",
    );
  const detailed = dayTasks as PlanData["tasks"];
  const tasks = (taskMeta as PlanData["tasks"]).map(
    (t) =>
      detailed.find((d) => d.id === t.id) || {
        ...t,
        name: "",
        target: "",
        cue: "",
        rest: "",
        source_page: 0,
      },
  );
  return {
    viewer,
    profiles: profiles as Profile[],
    plan: { programs, days, tasks, meals, options, notes, metrics } as PlanData,
    progress: {
      taskProgress,
      mealProgress,
      measurements,
      checkins,
    } as ProgressData,
    today: dateInZone(new Date(), zone),
    zone,
    view,
  };
}
export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

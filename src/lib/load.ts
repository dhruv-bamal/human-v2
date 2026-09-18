import "server-only";
import { requireMember } from "./auth";
import { dateInZone, trainingDate, rotationDay } from "./dates";
import type {
  PlanData,
  ProgressData,
  Profile,
  Person,
  LinkedRecipe,
} from "./types";
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
  const selectedPerson = person || viewer.id;
  const selectedProfile = (profiles as Profile[]).find(
    (p) => p.id === selectedPerson,
  )!;
  const rotation = rotationDay(
    selectedPerson,
    selectedDay || 1,
    selectedProfile.start_date,
  );
  const slotIds = (meals as PlanData["meals"])
    .filter((m) => m.person === selectedPerson && m.rotation_day === rotation)
    .map((m) => m.id);
  // One nested query, filtered to this day's slots; never fetch the whole recipe library.
  const recipeResult =
    slotIds.length && (view === "meals" || view === "overview")
      ? await db
          .from("meal_recipe_links")
          .select("*,recipe:recipes(*,recipe_ingredients(*),recipe_steps(*))")
          .in("slot_id", slotIds)
      : { data: [], error: null };
  if (recipeResult.error)
    throw new Error("Your meal preparation could not be loaded.");
  const linkedRecipes = (recipeResult.data as LinkedRecipe[])
    .map((link) => ({
      ...link,
      recipe: {
        ...link.recipe,
        recipe_ingredients: [...link.recipe.recipe_ingredients].sort(
          (a, b) => a.position - b.position,
        ),
        recipe_steps: [...link.recipe.recipe_steps].sort(
          (a, b) => a.step_number - b.step_number,
        ),
      },
    }))
    .sort((a, b) => a.position - b.position);
  const now = new Date();
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
    today: dateInZone(now, zone),
    trainingToday: {
      dhruv: trainingDate("dhruv", now, zone),
      annanya: trainingDate("annanya", now, zone),
    },
    linkedRecipes,
    zone,
    view,
  };
}
export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

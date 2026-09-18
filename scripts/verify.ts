import { database } from "./db";
import { seedGroups } from "./seed-data";
const sql = database();
try {
  for (const [table, rows] of seedGroups) {
    const actual = await sql.unsafe(`select * from public.${table}`);
    if (actual.length !== rows.length)
      throw new Error(table + " count mismatch");
    const key = (r: Record<string, unknown>) =>
      r.id ?? `${r.person}:${r.day ?? r.key}`;
    for (const expected of rows) {
      const got = actual.find((r) => key(r) === key(expected));
      if (!got) throw new Error("Missing row");
      for (const [k, v] of Object.entries(expected))
        if (String(got[k]) !== String(v)) throw new Error("Content mismatch");
    }
    console.log(table + ": " + actual.length + " rows verified field by field");
  }
  const profiles =
    await sql`select id, auth_user_id is not null as linked, start_date is not null as scheduled from public.profiles order by id`;
  console.log("Profile readiness:", profiles);
  const rls =
    await sql`select count(*)::int as count from pg_tables where schemaname='public' and rowsecurity=true and tablename in ('programs','profiles','program_days','plan_tasks','meal_slots','meal_options','program_notes','metric_definitions','task_progress','meal_progress','measurements','weekly_checkins','app_settings','recipes','recipe_ingredients','recipe_steps','meal_recipe_links')`;
  if (rls[0].count !== 17) throw new Error("RLS missing");
  console.log("All 17 application tables have RLS enabled.");
} catch {
  console.error(
    "Verification failed: seed, schema or connection differs from expectations.",
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}

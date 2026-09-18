import { database } from "./db";
import { plan } from "../src/lib/plans";
const sql = database();
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(810330)`;
    const groups = [
      ["programs", plan.programs, ["id"]],
      ["program_days", plan.days, ["person", "day"]],
      ["plan_tasks", plan.tasks, ["id"]],
      ["meal_slots", plan.meals, ["id"]],
      ["meal_options", plan.options, ["id"]],
      ["program_notes", plan.notes, ["id"]],
      ["metric_definitions", plan.metrics, ["person", "key"]],
    ] as const;
    for (const [table, rows, keys] of groups) {
      const columns = Object.keys(rows[0]);
      const updates = columns
        .filter((k) => !(keys as readonly string[]).includes(k))
        .map((k) => `"${k}"=excluded."${k}"`)
        .join(",");
      // Small batches keep the transaction fast across a hosted pool connection.
      for (let offset = 0; offset < rows.length; offset += 100) {
        const batch = rows.slice(offset, offset + 100);
        const values = batch.flatMap((row) => Object.values(row));
        const placeholders = batch
          .map(
            (_, rowIndex) =>
              `(${columns.map((_, columnIndex) => "$" + (rowIndex * columns.length + columnIndex + 1)).join(",")})`,
          )
          .join(",");
        await tx.unsafe(
          `insert into public."${table}" (${columns.map((k) => `"${k}"`).join(",")}) values ${placeholders} on conflict (${keys.join(",")}) do update set ${updates}`,
          values,
        );
      }
    }
    for (const id of ["dhruv", "annanya"])
      await tx`insert into public.profiles(id) values(${id}) on conflict(id) do nothing`;
  });
  console.log(
    `Seeded ${plan.days.length} days, ${plan.tasks.length} tasks, ${plan.meals.length} rotation slots; no progress modified.`,
  );
} catch (error) {
  console.error(
    "Seed failed; transaction rolled back. Database code:",
    (error as { code?: string }).code || "connection/runtime",
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}

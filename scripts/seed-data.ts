import { plan } from "../src/lib/plans";
import { recipeData } from "../src/lib/recipes";
// Shared by the hosted seed, verification and real-PostgreSQL regression tests.
export const seedGroups = [
  ["programs", plan.programs, ["id"]],
  ["program_days", plan.days, ["person", "day"]],
  ["plan_tasks", plan.tasks, ["id"]],
  ["meal_slots", plan.meals, ["id"]],
  ["meal_options", plan.options, ["id"]],
  ["program_notes", plan.notes, ["id"]],
  ["metric_definitions", plan.metrics, ["person", "key"]],
  ["recipes", recipeData.recipes, ["id"]],
  ["recipe_ingredients", recipeData.ingredients, ["id"]],
  ["recipe_steps", recipeData.steps, ["id"]],
  ["meal_recipe_links", recipeData.links, ["id"]],
] as const;
export function seedStatements() {
  const statements: {
    text: string;
    values: (string | number | boolean | null)[];
  }[] = [];
  for (const [table, rows, keys] of seedGroups) {
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const updates = columns
      .filter((k) => !(keys as readonly string[]).includes(k))
      .map((k) => `"${k}"=excluded."${k}"`)
      .join(",");
    for (let offset = 0; offset < rows.length; offset += 100) {
      const batch = rows.slice(offset, offset + 100);
      const values = batch.flatMap((row) => Object.values(row));
      const placeholders = batch
        .map(
          (_, i) =>
            `(${columns.map((_, j) => "$" + (i * columns.length + j + 1)).join(",")})`,
        )
        .join(",");
      statements.push({
        text: `insert into public."${table}" (${columns.map((k) => `"${k}"`).join(",")}) values ${placeholders} on conflict (${keys.join(",")}) do update set ${updates}`,
        values,
      });
    }
  }
  return statements;
}

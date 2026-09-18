import { database } from "./db";
import { plan } from "../src/lib/plans";
import { seedStatements } from "./seed-data";
const sql = database();
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(810330)`;
    for (const statement of seedStatements()) {
      await tx.unsafe(statement.text, statement.values);
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

import { database } from "./db";
const sql = database();
try {
  const rows = await sql`select id,email from auth.users order by created_at`;
  console.log(rows.length ? rows : "No Auth accounts exist yet.");
} catch {
  console.error("Unable to inspect Auth readiness.");
  process.exitCode = 1;
} finally {
  await sql.end();
}

import { readFile, readdir } from "node:fs/promises";
import { database } from "./db";
const sql = database();
try {
  await sql`create table if not exists public.tracker_migrations (name text primary key, applied_at timestamptz not null default now())`;
  await sql`revoke all on public.tracker_migrations from anon,authenticated`;
  for (const name of (await readdir("supabase/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const script = await readFile("supabase/migrations/" + name, "utf8");
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(810330)`;
      if (
        (
          await tx`select name from public.tracker_migrations where name=${name}`
        ).length
      )
        return;
      await tx.unsafe(script);
      await tx`insert into public.tracker_migrations(name) values(${name})`;
      console.log("Applied " + name);
    });
  }
  const zone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  new Intl.DateTimeFormat("en", { timeZone: zone }).format();
  await sql`update public.app_settings set timezone=${zone} where id=true`;
  console.log("Migrations ready.");
} catch {
  console.error(
    "Migration failed. Check connectivity, credentials and existing schema; no secrets were logged.",
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}

import assert from "node:assert/strict";
import { database } from "./db";
const sql = database();
const rollback = new Error("intentional rollback");
let verified = false;
try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const response = await fetch(url + "/rest/v1/program_days?select=day", {
    headers: { apikey: key },
  });
  assert(
    response.status === 401 || response.status === 403,
    "Anonymous request must be rejected",
  );
  const settings = await fetch(url + "/auth/v1/settings", {
    headers: { apikey: key },
  });
  assert(settings.ok);
  const authConfig = await settings.json();
  assert.equal(
    authConfig.disable_signup,
    true,
    "Public signup must be disabled",
  );
  console.log(
    "Hosted API rejects anonymous plan access; public signup is disabled.",
  );
  const ready =
    await sql`select p.id, u.email_confirmed_at is not null as confirmed from public.profiles p join auth.users u on u.id=p.auth_user_id order by p.id`;
  assert.equal(ready.length, 2);
  assert(ready.every((r) => r.confirmed));
  console.log("Both mapped email accounts are confirmed.");
  try {
    await sql.begin(async (tx) => {
      const identities =
        await tx`select id,auth_user_id from public.profiles order by id for update`;
      await tx`update public.profiles set start_date=public.local_today()-8`;
      for (const { id, auth_user_id } of identities) {
        await tx`select set_config('request.jwt.claim.sub',${auth_user_id},true)`;
        await tx.unsafe("set local role authenticated");
        assert.equal((await tx`select id from public.profiles`).length, 2);
        await tx`insert into public.task_progress(person,day,task_id,completed) values(${id},1,${id + "-1-1"},true) on conflict(person,day,task_id) do update set completed=true`;
        assert.equal(
          (
            await tx`select completed from public.task_progress where person=${id} and day=1 and task_id=${id + "-1-1"}`
          )[0].completed,
          true,
        );
        assert.equal((await tx`select id from public.recipes`).length, 10);
        assert.equal((await tx`select id from public.recipe_steps`).length, 40);
        const rotation =
          id === "dhruv"
            ? Number(
                (
                  await tx`select extract(isodow from start_date)::int as day from profiles where id=${id}`
                )[0].day,
              )
            : 1;
        const slot = `${id}-meal-${rotation}-${id === "dhruv" ? "snack" : "1"}`;
        await tx`insert into public.meal_progress(person,day,slot_id,completed,notes) values(${id},1,${slot},true,'rollback verification') on conflict(person,day,slot_id) do update set completed=true`;
        assert.equal(
          (
            await tx`select completed from public.meal_progress where person=${id} and day=1 and slot_id=${slot}`
          )[0].completed,
          true,
        );
        const peer = id === "dhruv" ? "annanya" : "dhruv";
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`insert into public.task_progress(person,day,task_id,completed) values(${peer},1,${peer + "-1-1"},true) on conflict(person,day,task_id) do update set completed=true`;
          }),
        );
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`insert into public.task_progress(person,day,task_id) values(${id},30,${id + "-30-1"})`;
          }),
        );
        const changed =
          await tx`update public.task_progress set completed=false where person=${peer} returning person`;
        assert.equal(changed.length, 0);
        assert.equal(
          (
            await tx`update public.meal_progress set completed=false where person=${peer} returning person`
          ).length,
          0,
        );
        const peerRotation =
          peer === "dhruv"
            ? Number(
                (
                  await tx`select extract(isodow from start_date)::int as day from profiles where id=${peer}`
                )[0].day,
              )
            : 1;
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`insert into public.meal_progress(person,day,slot_id,completed) values(${peer},1,${`${peer}-meal-${peerRotation}-1`},true) on conflict(person,day,slot_id) do update set completed=true`;
          }),
        );
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`update public.recipes set notes='forbidden' where id='banana-milk-shake'`;
          }),
        );
        await tx.unsafe("reset role");
      }
      verified = true;
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert(verified);
  console.log(
    "Live PostgreSQL: both owners can save meals and workouts; recipes readable, definitions protected; both peer writes and future writes rejected. All test changes rolled back.",
  );
} catch {
  console.error("Access verification failed. No test changes were committed.");
  process.exitCode = 1;
} finally {
  await sql.end();
}

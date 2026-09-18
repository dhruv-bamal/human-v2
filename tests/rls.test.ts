import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { plan } from "../src/lib/plans";
test("PostgreSQL RLS, identities, FK isolation, future dates, meals and protected definitions", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to authenticated;`,
    );
    await db.exec(
      await readFile("supabase/migrations/001_initial.sql", "utf8"),
    );
    const ids = {
      dhruv: "11111111-1111-4111-8111-111111111111",
      annanya: "22222222-2222-4222-8222-222222222222",
      outsider: "33333333-3333-4333-8333-333333333333",
    };
    await db.query(
      "insert into auth.users values($1),($2),($3)",
      Object.values(ids),
    );
    for (const [table, rows] of [
      ["programs", plan.programs],
      ["program_days", plan.days],
      ["plan_tasks", plan.tasks],
      ["meal_slots", plan.meals],
      ["metric_definitions", plan.metrics],
    ] as const) {
      for (const row of rows) {
        const columns = Object.keys(row);
        await db.query(
          `insert into ${table}(${columns.join(",")}) values(${columns.map((_, i) => "$" + (i + 1)).join(",")})`,
          Object.values(row),
        );
      }
    }
    await db.query(
      `insert into profiles values('dhruv',$1,public.local_today()-8),('annanya',$2,public.local_today()-8)`,
      [ids.dhruv, ids.annanya],
    );
    async function asUser(id: string) {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    }
    for (const person of ["dhruv", "annanya"] as const) {
      await t.test(
        `${person}: own writes succeed, peer writes cannot change data`,
        async () => {
          await asUser(ids[person]);
          const other = person === "dhruv" ? "annanya" : "dhruv";
          assert.equal(
            (await db.query("select * from profiles")).rows.length,
            2,
          );
          await db.query(
            `insert into task_progress(person,day,task_id,completed) values($1,1,$2,true)`,
            [person, `${person}-1-1`],
          );
          await assert.rejects(
            db.query(
              `insert into task_progress(person,day,task_id,completed) values($1,1,$2,true)`,
              [other, `${other}-1-2`],
            ),
          );
          const changed = await db.query(
            `update task_progress set completed=false where person=$1 returning person`,
            [other],
          );
          assert.equal(changed.rows.length, 0);
          await assert.rejects(
            db.query(
              `insert into task_progress(person,day,task_id,completed) values($1,10,$2,true)`,
              [person, `${person}-10-1`],
            ),
          );
          await assert.rejects(
            db.query(
              `insert into task_progress(person,day,task_id,completed) values($1,2,$2,true)`,
              [person, `${other}-2-1`],
            ),
          );
          await assert.rejects(
            db.query(
              `update profiles set start_date=public.local_today() where id=$1`,
              [person],
            ),
          );
          await assert.rejects(
            db.query(
              `update program_days set title='Modified' where person=$1`,
              [person],
            ),
          );
          await assert.rejects(
            db.query(`delete from task_progress where person=$1`, [person]),
          );
        },
      );
    }
    await t.test(
      "unknown authenticated account and anonymous role cannot read private plans",
      async () => {
        await asUser(ids.outsider);
        assert.equal(
          (await db.query("select * from plan_tasks")).rows.length,
          0,
        );
        await assert.rejects(
          db.query(
            `insert into task_progress(person,day,task_id) values('dhruv',1,'dhruv-1-1')`,
          ),
        );
        await db.exec("reset role;set role anon");
        await assert.rejects(db.query("select * from profiles"));
      },
    );
    await t.test(
      "real weekday meal is validated by database; Annanya uses sequence",
      async () => {
        await asUser(ids.dhruv);
        const result = await db.query<{ rotation: number }>(
          `select extract(isodow from start_date)::int as rotation from profiles where id='dhruv'`,
        );
        const rotation = result.rows[0].rotation;
        await db.query(
          `insert into meal_progress(person,day,slot_id,completed) values('dhruv',1,$1,true)`,
          [`dhruv-meal-${rotation}-1`],
        );
        await assert.rejects(
          db.query(
            `insert into meal_progress(person,day,slot_id) values('dhruv',1,$1)`,
            [`dhruv-meal-${(rotation % 7) + 1}-2`],
          ),
        );
        await asUser(ids.annanya);
        await db.query(
          `insert into meal_progress(person,day,slot_id) values('annanya',1,'annanya-meal-1-1')`,
        );
        await assert.rejects(
          db.query(
            `insert into meal_progress(person,day,slot_id) values('annanya',1,'annanya-meal-2-1')`,
          ),
        );
        await assert.rejects(
          db.query(`insert into measurements values('annanya',1,'steps',-1)`),
        );
        await assert.rejects(
          db.query(
            `insert into weekly_checkins(person,week) values('annanya',4)`,
          ),
        );
      },
    );
    await t.test(
      "idempotent upsert and direct identity forgery resistance",
      async () => {
        await asUser(ids.dhruv);
        await db.query(
          `insert into task_progress(person,day,task_id,completed) values('dhruv',1,'dhruv-1-1',false) on conflict(person,day,task_id) do update set completed=excluded.completed`,
        );
        assert.equal(
          (
            await db.query(
              `select * from task_progress where person='dhruv' and day=1`,
            )
          ).rows.length,
          1,
        );
        await assert.rejects(
          db.query(
            `update task_progress set person='annanya',task_id='annanya-1-1' where person='dhruv'`,
          ),
        );
      },
    );
    await t.test("start date RPC is owner-scoped and one time", async () => {
      await db.exec("reset role");
      await db.query(`update profiles set start_date=null where id='annanya'`);
      await asUser(ids.annanya);
      await assert.rejects(
        db.query("select set_start_date(public.local_today()-1)"),
      );
      await db.query("select set_start_date(public.local_today()+1)");
      await assert.rejects(
        db.query("select set_start_date(public.local_today()+2)"),
      );
    });
  } finally {
    await db.close();
  }
});

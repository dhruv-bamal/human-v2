import { database } from "./db";
import { z } from "zod";
const sql = database();
try {
  const dhruv = z.uuid().parse(process.env.DHRUV_AUTH_USER_ID),
    annanya = z.uuid().parse(process.env.ANNANYA_AUTH_USER_ID);
  if (dhruv === annanya) throw new Error("Distinct users required");
  await sql.begin(async (tx) => {
    for (const [person, id] of [
      ["dhruv", dhruv],
      ["annanya", annanya],
    ]) {
      const existing =
        await tx`select auth_user_id from public.profiles where id=${person} for update`;
      if (existing[0]?.auth_user_id && existing[0].auth_user_id !== id)
        throw new Error("Refusing to replace an existing identity");
      if (!(await tx`select id from auth.users where id=${id}`).length)
        throw new Error("Create this Auth user first");
      await tx`update public.profiles set auth_user_id=${id} where id=${person}`;
    }
  });
  console.log("Both existing Auth accounts linked.");
} catch {
  console.error(
    "Linking failed. Verify both distinct existing Auth IDs; existing links are protected.",
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}

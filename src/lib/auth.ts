import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabase, configured } from "./supabase/server";
import type { Profile } from "./types";
export const requireMember = cache(async () => {
  if (!configured()) redirect("/login");
  const db = await supabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  const result = await db
    .from("profiles")
    .select("id,auth_user_id,start_date")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (result.error) throw new Error("Unable to load your account.");
  if (!result.data) redirect("/login?access=restricted");
  return { db, user, profile: result.data as Profile };
});

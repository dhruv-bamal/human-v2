"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, configured } from "@/lib/supabase/server";
import { dateInZone, canEditDay, validDate } from "@/lib/dates";
import type { Person, Profile } from "@/lib/types";
export type Result = { ok: boolean; message: string };
const failed: Result = {
  ok: false,
  message: "Could not save. Check your connection and try again.",
};
const person = z.enum(["dhruv", "annanya"]);
const day = z.number().int().min(1).max(30);
const common = z.object({ person, day });
const taskSchema = common.extend({
  task_id: z.string().min(1).max(100),
  completed: z.boolean(),
  actual: z.string().max(500),
  notes: z.string().max(2000),
});
const mealSchema = common.extend({
  slot_id: z.string().min(1).max(100),
  completed: z.boolean(),
  notes: z.string().max(2000),
});
async function owner(requested: Person, dayNumber: number) {
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Access denied");
  const { data, error } = await db
    .from("profiles")
    .select("id,auth_user_id,start_date")
    .eq("auth_user_id", user.id)
    .single();
  const profile = data as Profile | null;
  if (
    error ||
    !profile ||
    profile.id !== requested ||
    !canEditDay(
      profile.start_date,
      dayNumber,
      dateInZone(new Date(), process.env.APP_TIMEZONE || "Asia/Kolkata"),
    )
  )
    throw new Error("Access denied");
  return { db, profile };
}
export async function saveTask(input: unknown): Promise<Result> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Please check the exercise entry." };
  try {
    const { db, profile } = await owner(parsed.data.person, parsed.data.day);
    const { error } = await db
      .from("task_progress")
      .upsert(
        { ...parsed.data, person: profile.id },
        { onConflict: "person,day,task_id" },
      );
    if (error) return failed;
    revalidatePath("/app", "layout");
    return { ok: true, message: "Exercise saved." };
  } catch {
    return failed;
  }
}
export async function saveMeal(input: unknown): Promise<Result> {
  const parsed = mealSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Please check the meal entry." };
  try {
    const { db, profile } = await owner(parsed.data.person, parsed.data.day);
    const { error } = await db
      .from("meal_progress")
      .upsert(
        { ...parsed.data, person: profile.id },
        { onConflict: "person,day,slot_id" },
      );
    if (error) return failed;
    revalidatePath("/app", "layout");
    return { ok: true, message: "Meal saved." };
  } catch {
    return failed;
  }
}
export async function saveMeasurement(input: unknown): Promise<Result> {
  const parsed = common
    .extend({
      metric: z.string().max(50),
      value: z.number().finite().min(0).max(100000),
    })
    .safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Enter a valid measurement." };
  try {
    const { db, profile } = await owner(parsed.data.person, parsed.data.day);
    const { error } = await db
      .from("measurements")
      .upsert(
        { ...parsed.data, person: profile.id },
        { onConflict: "person,day,metric" },
      );
    if (error)
      return {
        ok: false,
        message:
          "That measurement is outside the supported range. Check the value.",
      };
    revalidatePath("/app", "layout");
    return { ok: true, message: "Measurement saved." };
  } catch {
    return failed;
  }
}
export async function saveCheckin(input: unknown): Promise<Result> {
  const parsed = z
    .object({
      person: z.literal("annanya"),
      week: z.number().int().min(1).max(4),
      energy: z.number().int().min(1).max(5).nullable(),
      ankle_comfort: z.number().int().min(1).max(5).nullable(),
      strength: z.string().max(500),
      notes: z.string().max(2000),
    })
    .safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Use ratings from 1 to 5." };
  try {
    const { db } = await owner("annanya", (parsed.data.week - 1) * 7 + 1);
    const { error } = await db
      .from("weekly_checkins")
      .upsert(parsed.data, { onConflict: "person,week" });
    if (error) return failed;
    revalidatePath("/app", "layout");
    return { ok: true, message: "Weekly check-in saved." };
  } catch {
    return failed;
  }
}
export async function setStart(input: unknown): Promise<Result> {
  const parsed = z.string().refine(validDate).safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Choose a valid start date." };
  try {
    const db = await supabase();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) return failed;
    const { error } = await db.rpc("set_start_date", {
      chosen_date: parsed.data,
    });
    if (error)
      return {
        ok: false,
        message:
          "Choose today or a future date. An existing start date cannot be changed here.",
      };
    revalidatePath("/app", "layout");
    return { ok: true, message: "Start date saved." };
  } catch {
    return failed;
  }
}
export async function login(
  _previous: Result,
  form: FormData,
): Promise<Result> {
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(200) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success)
    return { ok: false, message: "Enter your email and password." };
  if (!configured())
    return { ok: false, message: "Your private tracker is not connected yet." };
  try {
    const db = await supabase();
    const { data, error } = await db.auth.signInWithPassword(parsed.data);
    if (error || !data.user)
      return {
        ok: false,
        message: "Unable to sign in. Check your details and try again.",
      };
    const member = await db
      .from("profiles")
      .select("id")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();
    if (member.error || !member.data) {
      await db.auth.signOut();
      return {
        ok: false,
        message: "This account does not have access to this private tracker.",
      };
    }
  } catch {
    return {
      ok: false,
      message: "Sign-in is temporarily unavailable. Please try again.",
    };
  }
  redirect("/app/today");
}
export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/login");
}

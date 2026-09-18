import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { loadDashboard } from "@/lib/load";
import { trainingDate, programStatus } from "@/lib/dates";
import { Dashboard, type View } from "@/components/dashboard";
import type { Person, Profile } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ person: string; view: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { person, view } = await params;
  const search = await searchParams;
  if (
    !["dhruv", "annanya"].includes(person) ||
    !["overview", "exercise", "meals", "progress"].includes(view)
  )
    notFound();
  const { db } = await requireMember();
  const { data: profile, error } = await db
    .from("profiles")
    .select("id,auth_user_id,start_date")
    .eq("id", person)
    .single();
  if (error || !profile) throw new Error("Unable to load profile.");
  const requested =
    search.day === undefined
      ? programStatus(
          (profile as Profile).start_date,
          trainingDate(
            person as Person,
            new Date(),
            process.env.APP_TIMEZONE || "Asia/Kolkata",
          ),
        ).day
      : Number(search.day);
  if (!Number.isInteger(requested) || requested < 1 || requested > 30)
    notFound();
  const data = await loadDashboard(person as Person, view, requested);
  return (
    <Dashboard
      data={data}
      person={person as Person}
      view={view as View}
      day={requested}
    />
  );
}

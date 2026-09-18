import { requireMember } from "@/lib/auth";
import { loadDashboard } from "@/lib/load";
import { trainingDate, programStatus } from "@/lib/dates";
import { Dashboard } from "@/components/dashboard";
export const dynamic = "force-dynamic";
export default async function Today() {
  const { profile } = await requireMember();
  const day = programStatus(
    profile.start_date,
    trainingDate(
      profile.id,
      new Date(),
      process.env.APP_TIMEZONE || "Asia/Kolkata",
    ),
  ).day;
  const data = await loadDashboard(profile.id, "overview", day);
  return <Dashboard data={data} person={profile.id} day={day} isToday />;
}

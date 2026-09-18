import { notFound } from "next/navigation";
import { Dashboard, type View } from "@/components/dashboard";
import { plan } from "@/lib/plans";
import { recipeData } from "@/lib/recipes";
import { dateInZone, trainingDate } from "@/lib/dates";
import type { Person, Profile } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function Preview({
  searchParams,
}: {
  searchParams: Promise<{ person?: string; day?: string; view?: string }>;
}) {
  // Never available in production, even with a spoofed host or query string.
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const person: Person = query.person === "annanya" ? "annanya" : "dhruv";
  const day = Math.max(1, Math.min(30, Number(query.day) || 1));
  const view = (
    ["overview", "exercise", "meals", "progress"].includes(query.view || "")
      ? query.view
      : "overview"
  ) as View;
  const today = dateInZone();
  const profiles: Profile[] = [
    { id: "dhruv", auth_user_id: null, start_date: today },
    { id: "annanya", auth_user_id: null, start_date: today },
  ];
  return (
    <Dashboard
      preview
      data={{
        viewer: profiles[0],
        profiles,
        plan,
        progress: {
          taskProgress: [],
          mealProgress: [],
          measurements: [],
          checkins: [],
        },
        today,
        trainingToday: { dhruv: trainingDate("dhruv"), annanya: today },
        linkedRecipes: recipeData.links.map((link) => ({
          ...link,
          recipe: {
            ...recipeData.recipes.find((r) => r.id === link.recipe_id)!,
            recipe_ingredients: recipeData.ingredients.filter(
              (i) => i.recipe_id === link.recipe_id,
            ),
            recipe_steps: recipeData.steps.filter(
              (s) => s.recipe_id === link.recipe_id,
            ),
          },
        })),
        zone: "Asia/Kolkata",
        view,
      }}
      person={person}
      view={view}
      day={day}
    />
  );
}

"use client";
import { useId, useRef, useState } from "react";
import { BookOpen, Check, Leaf, X } from "lucide-react";
import type { LinkedRecipe, Meal } from "@/lib/types";

export function MealPrep({
  meal,
  recipes,
  editable,
  completed,
  pending,
  onComplete,
  status,
}: {
  meal: Meal;
  recipes: LinkedRecipe[];
  editable: boolean;
  completed: boolean;
  pending: boolean;
  onComplete: () => void;
  status: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    if (!editable) return;
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return (
    <>
      <button
        type="button"
        className="button prep-open"
        onClick={() => dialog.current?.showModal()}
      >
        <BookOpen size={17} /> View Meal Prep
      </button>
      <dialog
        ref={dialog}
        className="prep-dialog"
        aria-labelledby={titleId}
        onClose={() => setChecked(new Set())}
      >
        <header className="prep-header">
          <div>
            <span className="eyebrow">
              {meal.timing} · {meal.label}
            </span>
            <h2 id={titleId}>Prepare your meal</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close Meal Prep"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        <div className="prep-content">
          <section className="prep-context">
            <span className="eyebrow">The complete meal</span>
            <h3>{meal.menu}</h3>
            <p>{meal.notes}</p>
            {meal.vegetarian && (
              <span className="vegetarian">
                <Leaf size={14} /> Vegetarian
              </span>
            )}
          </section>
          {!editable && (
            <p className="notice">
              Read only · Ingredient checks and meal completion are available
              only to the owner on an active or past training day.
            </p>
          )}
          <p className="prep-hint">
            {editable
              ? "Tap ingredients as you cook. Checks clear when you close this sheet; only meal completion is saved."
              : "Use the ingredients and numbered steps below to follow the plan."}
          </p>
          {recipes.map(({ id, recipe, context }) => (
            <section className="prep-recipe" key={id}>
              <div className="recipe-title">
                <h2>{recipe.name}</h2>
                <span className="recipe-diet">
                  {recipe.vegetarian
                    ? "Vegetarian recipe"
                    : "Contains eggs / chicken"}
                </span>
              </div>
              {context && <p className="notice">{context}</p>}
              <h3 className="prep-section-title">Ingredients</h3>
              <p className="footnote">
                Quantities as written in your plan. Unspecified amounts are left
                open.
              </p>
              <ul className="ingredients">
                {recipe.recipe_ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    <label
                      className={`ingredient ${checked.has(ingredient.id) ? "ingredient-checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(ingredient.id)}
                        disabled={!editable}
                        onChange={() => toggle(ingredient.id)}
                      />
                      <span>
                        <strong>
                          {[
                            ingredient.quantity,
                            ingredient.unit,
                            ingredient.ingredient_name,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </strong>
                        {(ingredient.optional ||
                          ingredient.preparation_note) && (
                          <small>
                            {[
                              ingredient.optional ? "Optional" : "",
                              ingredient.preparation_note,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <h3 className="prep-section-title">Preparation</h3>
              <ol className="prep-steps">
                {recipe.recipe_steps.map((step) => (
                  <li key={step.id}>
                    <span className="step-number" aria-hidden="true">
                      {step.step_number}
                    </span>
                    <p>{step.instruction}</p>
                  </li>
                ))}
              </ol>
              {recipe.notes && (
                <aside className="recipe-notes">
                  <h3>From your plan</h3>
                  <p>{recipe.notes}</p>
                </aside>
              )}
              <p className="footnote">
                Updated Workout Plan ·{" "}
                {recipe.id === "egg-sausage-sandwich"
                  ? "pages 6–7"
                  : `page ${recipe.source_page}`}
                {recipe.id === "banana-milk-shake"
                  ? " · alternatives also on page 2"
                  : ""}
              </p>
            </section>
          ))}
        </div>
        <footer className="prep-footer">
          {status}
          <button
            type="button"
            className="button primary"
            disabled={!editable || pending || completed}
            onClick={onComplete}
          >
            {completed ? (
              <>
                <Check size={18} /> Meal completed
              </>
            ) : pending ? (
              "Saving meal…"
            ) : (
              "Mark Meal Complete"
            )}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => dialog.current?.close()}
          >
            Back to meals
          </button>
        </footer>
      </dialog>
    </>
  );
}

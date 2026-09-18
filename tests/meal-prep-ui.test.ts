import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MealPrep } from "../src/components/meal-prep";
import { plan } from "../src/lib/plans";
import { recipeData } from "../src/lib/recipes";

test("Meal Prep interaction: open and ingredient checks never save; explicit completion does; peer cannot change state", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="app"></div></body></html>',
    { url: "http://localhost" },
  );
  const saved = Object.getOwnPropertyDescriptors(globalThis);
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true },
    document: { value: dom.window.document, configurable: true },
    IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true },
  });
  // jsdom provides the dialog DOM but not top-layer browser behavior. Exercise
  // our handlers here; native focus/Escape behavior is also reviewed in-browser.
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event("close"));
  };
  const root = createRoot(dom.window.document.getElementById("app")!);
  const meal = plan.meals.find((m) => m.id === "dhruv-meal-1-1")!;
  const recipes = recipeData.links
    .filter((l) => l.slot_id === meal.id)
    .map((l) => ({
      ...l,
      recipe: {
        ...recipeData.recipes.find((r) => r.id === l.recipe_id)!,
        recipe_ingredients: recipeData.ingredients.filter(
          (i) => i.recipe_id === l.recipe_id,
        ),
        recipe_steps: recipeData.steps.filter(
          (s) => s.recipe_id === l.recipe_id,
        ),
      },
    }));
  let saves = 0;
  const render = async (
    editable: boolean,
    completed = false,
    pending = false,
  ) => {
    await act(async () =>
      root.render(
        createElement(MealPrep, {
          meal,
          recipes,
          editable,
          completed,
          pending,
          onComplete: () => {
            saves++;
          },
          status: null,
        }),
      ),
    );
  };
  const button = (label: string) =>
    [...dom.window.document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(label),
    )!;
  try {
    await render(true);
    await act(async () => button("View Meal Prep").click());
    assert(dom.window.document.querySelector("dialog")!.open);
    assert.equal(saves, 0);
    const ingredient = dom.window.document.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;
    await act(async () => ingredient.click());
    assert(ingredient.checked);
    assert.equal(saves, 0);
    assert.deepEqual(
      [...dom.window.document.querySelectorAll(".step-number")].map(
        (n) => n.textContent,
      ),
      ["1", "2", "3", "4"],
    );
    assert(
      dom.window.document
        .querySelector(".prep-context")!
        .textContent!.includes("+ 2 eggs"),
    );
    await act(async () => button("Back to meals").click());
    await act(async () => button("View Meal Prep").click());
    assert(!ingredient.checked, "temporary checklist resets when closed");
    assert.equal(saves, 0);
    await act(async () => button("Mark Meal Complete").click());
    assert.equal(saves, 1);
    await render(true, true);
    assert(button("Meal completed").disabled);
    await render(true, false, true);
    assert(button("Saving meal").disabled);
    await render(false);
    assert(ingredient.disabled);
    assert(button("Mark Meal Complete").disabled);
    await act(async () => ingredient.click());
    assert(!ingredient.checked);
    await act(async () => button("Mark Meal Complete").click());
    assert.equal(saves, 1);
    assert(
      dom.window.document
        .querySelector("dialog")!
        .textContent!.includes("Read only"),
    );
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const key of ["window", "document", "IS_REACT_ACT_ENVIRONMENT"]) {
      if (saved[key]) Object.defineProperty(globalThis, key, saved[key]);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

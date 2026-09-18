// Updated Workout Plan, pp. 6–7. Ingredient groups/options and quantities are
// transcribed as written; blank quantity means the PDF does not specify one.
import type { RecipeData, RecipeIngredient } from "./types";
export const recipeData: RecipeData = {
  recipes: [],
  ingredients: [],
  steps: [],
  links: [],
};
type Ingredient = [
  name: string,
  quantity?: string,
  unit?: string,
  note?: string,
  optional?: boolean,
];
function recipe(
  id: string,
  name: string,
  vegetarian: boolean,
  source_page: number,
  ingredients: Ingredient[],
  steps: string[],
  notes = "",
) {
  recipeData.recipes.push({ id, name, vegetarian, source_page, notes });
  ingredients.forEach(
    (
      [
        ingredient_name,
        quantity = "",
        unit = "",
        preparation_note = "",
        optional = false,
      ],
      i,
    ) => {
      const row: RecipeIngredient = {
        id: `${id}-ingredient-${i + 1}`,
        recipe_id: id,
        position: i + 1,
        ingredient_name,
        quantity,
        unit,
        preparation_note,
        optional,
      };
      recipeData.ingredients.push(row);
    },
  );
  steps.forEach((instruction, i) =>
    recipeData.steps.push({
      id: `${id}-step-${i + 1}`,
      recipe_id: id,
      step_number: i + 1,
      instruction,
    }),
  );
}
recipe(
  "vegetable-masala-oats",
  "Vegetable Masala Oats",
  true,
  6,
  [
    ["oats", "70–80", "g"],
    ["onion", "1/2"],
    ["tomato", "1"],
    ["carrot/cabbage/spinach", "handful", "", "chopped"],
    ["water", "250–300", "ml"],
    ["salt, pepper, chilli/turmeric or preferred spices"],
  ],
  [
    "Chop the vegetables finely.",
    "Add vegetables, water and spices to a pan; cook 3-4 minutes.",
    "Stir in oats and simmer 3-5 minutes until thick.",
    "Add a little water if needed. On non-veg days, serve with 2-4 cooked eggs.",
  ],
  "On non-veg days, serve with 2-4 cooked eggs.",
);
recipe(
  "pb-banana-oatmeal",
  "Peanut-Butter Banana Oatmeal",
  true,
  6,
  [
    ["oats", "70–90", "g"],
    ["milk", "250–300", "ml"],
    ["banana", "1"],
    ["peanut butter", "15–25", "g"],
  ],
  [
    "Cook oats with milk on low heat until soft, or soak until softened if cooking is inconvenient.",
    "Slice or mash the banana into the oats.",
    "Stir in peanut butter after removing from heat.",
    "Keep peanut butter moderate on fat-loss days.",
  ],
);
recipe(
  "banana-milk-shake",
  "Banana-Milk Pre-workout Shake",
  true,
  6,
  [
    ["banana", "1"],
    ["milk", "200–250", "ml"],
    ["oats", "10–15", "g", "if you tolerate it well", true],
  ],
  [
    "Add banana and milk to a blender.",
    "Blend until smooth.",
    "Drink around 12:20-12:30 AM.",
    "If it feels heavy during the run, remove the oats or use a banana alone.",
  ],
  "If milk feels heavy before running, use a banana alone or a small piece of toast instead.",
);
recipe(
  "vegetable-omelette-toast",
  "Vegetable Omelette Toast",
  false,
  6,
  [
    ["eggs", "2–4"],
    ["bread", "2–4", "slices"],
    ["onion, tomato, capsicum/spinach", "", "", "chopped"],
    ["salt, pepper and spices"],
  ],
  [
    "Beat eggs with spices.",
    "Mix in finely chopped vegetables.",
    "Cook in a non-stick pan until the egg is fully set, flipping carefully if needed.",
    "Serve with toasted bread and sliced cucumber/tomato.",
  ],
);
recipe(
  "egg-vegetable-scramble",
  "Egg-Vegetable Scramble",
  false,
  6,
  [
    ["eggs", "3–4"],
    ["onion"],
    ["tomato"],
    ["capsicum/spinach/cabbage"],
    ["spices"],
    ["bread", "2–4", "slices"],
  ],
  [
    "Cook chopped vegetables in a non-stick pan with a splash of water if necessary.",
    "Beat eggs and pour them over the vegetables.",
    "Stir gently until the eggs are fully cooked.",
    "Season and serve with bread.",
  ],
);
recipe(
  "sausage-vegetable-skillet",
  "Sausage-Vegetable Skillet",
  false,
  6,
  [
    ["chicken sausages", "2"],
    ["onion"],
    ["tomato"],
    ["capsicum/cabbage"],
    ["spices"],
    ["bread", "2–4", "slices"],
  ],
  [
    "Cook sausages exactly according to the package instructions until safely cooked through.",
    "Slice them into pieces.",
    "Cook chopped vegetables in the same pan, then return sausage pieces and season.",
    "Serve with bread. Keep sausages supplementary rather than making them the main protein every day.",
  ],
);
recipe(
  "egg-sausage-sandwich",
  "Egg & Sausage Vegetable Sandwich",
  false,
  7,
  [
    ["eggs", "2"],
    ["chicken sausages", "1–2", "", "cooked"],
    ["bread", "4", "slices"],
    ["tomato, cucumber/onion/capsicum"],
    ["spices"],
  ],
  [
    "Cook eggs and sausages safely.",
    "Slice the vegetables and cooked sausage.",
    "Layer egg, sausage and vegetables between bread slices.",
    "Toast in a dry pan if desired and serve with fruit.",
  ],
);
recipe(
  "vegetable-pb-sandwich",
  "Crunchy Vegetable Peanut-Butter Sandwich",
  true,
  7,
  [
    ["bread", "4", "slices"],
    ["peanut butter", "20–30", "g"],
    ["cucumber/carrot", "", "", "thin slices"],
    ["banana or another fruit", "", "", "on the side"],
  ],
  [
    "Toast bread if desired.",
    "Spread a thin, measured layer of peanut butter.",
    "Add thin cucumber or carrot slices for crunch.",
    "Close the sandwich and serve with fruit and milk.",
  ],
);
recipe(
  "savory-vegetable-oats",
  "Savory Vegetable Oats",
  true,
  7,
  [
    ["oats", "80–100", "g"],
    ["onion"],
    ["tomato"],
    ["carrot/cabbage/spinach"],
    ["spices"],
    ["water"],
  ],
  [
    "Chop vegetables.",
    "Cook vegetables with spices and a little water until slightly softened.",
    "Add oats and enough water for the texture you prefer.",
    "Simmer until cooked; serve with milk and fruit separately.",
  ],
);
recipe(
  "fruit-oat-bowl",
  "Fruit Oat Bowl",
  true,
  7,
  [
    ["oats", "70–90", "g"],
    ["milk", "250–300", "ml"],
    ["banana/guava/orange/papaya/apple", "1", "serving"],
    ["peanut butter", "15–20", "g", "if needed", true],
  ],
  [
    "Prepare oats with milk.",
    "Chop the chosen fruit; add after the oats cool slightly.",
    "Add peanut butter only if the day's calories/budget allow.",
    "Use seasonal fruit to control cost.",
  ],
);
// Monday's egg-vegetable toast uses the matching omelette-toast method.
// Thursday's vegetable toast has no exact recipe; do not silently add PB.
const mapping: [string, string | null, string][] = [
  [
    "vegetable-masala-oats",
    "vegetable-omelette-toast",
    "The omelette-toast recipe covers the egg-vegetable toast. Keep the 2 sausages and fruit from this meal; follow the sausage package cooking instructions.",
  ],
  ["pb-banana-oatmeal", "vegetable-pb-sandwich", "Serve with milk and fruit."],
  [
    "vegetable-omelette-toast",
    "vegetable-masala-oats",
    "Serve the oats with 4 cooked eggs and cucumber/tomato.",
  ],
  ["fruit-oat-bowl", null, ""],
  [
    "egg-vegetable-scramble",
    "sausage-vegetable-skillet",
    "Keep the bread and fruit from this meal.",
  ],
  [
    "pb-banana-oatmeal",
    "savory-vegetable-oats",
    "Serve with milk and fruit separately.",
  ],
  ["vegetable-masala-oats", "egg-sausage-sandwich", "Serve with fruit."],
];
for (const [i, [first, second, context]] of mapping.entries()) {
  for (const [slot, recipe_id, note] of [
    ["1", first, "Keep all the sides listed in today’s meal."],
    [
      "snack",
      "banana-milk-shake",
      i === 3
        ? "Banana alone OR banana-milk shake, as prescribed for Thursday."
        : "Keep this feeding small.",
    ],
    ["2", second, context],
  ] as const) {
    if (recipe_id)
      recipeData.links.push({
        id: `dhruv-meal-${i + 1}-${slot}-${recipe_id}`,
        slot_id: `dhruv-meal-${i + 1}-${slot}`,
        recipe_id,
        position: 1,
        context: note,
      });
  }
}

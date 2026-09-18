import type { Note } from "./types";
// Updated Workout Plan, p. 8: verbatim shopping/preparation guidance.
const guidance = [
  [
    "Seasonal produce",
    "Buy seasonal vegetables and fruit based on price; there is no requirement to use the same produce every day.",
  ],
  [
    "Keep bananas ready",
    "Keep bananas available for pre-workout use because they are simple, portable carbohydrate fuel.",
  ],
  [
    "Chop ahead",
    "Batch-chop vegetables for 1-2 days only if you can refrigerate them safely.",
  ],
  [
    "Store and cook safely",
    "Follow the sausage package's refrigeration/freezing and cooking instructions. Do not leave milk, cooked eggs or cooked sausage unrefrigerated for long periods.",
  ],
  [
    "Seasoning",
    "Spices can be used freely for variety, but very salty seasoning plus processed sausages can push sodium intake upward.",
  ],
  [
    "Water first",
    "Water is the default drink. You do not need juice, sports drinks or protein powder for this plan.",
  ],
];
export const kitchenNotes: Note[] = guidance.map(([title, body], i) => ({
  id: `dhruv-kitchen-${i + 1}`,
  person: "dhruv",
  category: "kitchen",
  title,
  body,
  source_page: 8,
}));

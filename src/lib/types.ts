export type Person = "dhruv" | "annanya";
export type Program = {
  id: Person;
  name: string;
  goal: string;
  meal_basis: "weekday" | "sequence";
  source: string;
};
export type Profile = {
  id: Person;
  auth_user_id: string | null;
  start_date: string | null;
};
export type PlanDay = {
  person: Person;
  day: number;
  week: number;
  title: string;
  focus: string;
  kind: "strength" | "recovery" | "rest" | "benchmark";
  instructions: string;
  source_page: number;
};
export type Task = {
  id: string;
  person: Person;
  day: number;
  position: number;
  name: string;
  target: string;
  kind: string;
  cue: string;
  rest: string;
  optional: boolean;
  source_page: number;
};
export type Meal = {
  id: string;
  person: Person;
  rotation_day: number;
  position: number;
  label: string;
  menu: string;
  optional: boolean;
  notes: string;
};
export type MealOption = {
  id: string;
  slot_id: string;
  position: number;
  description: string;
};
export type Note = {
  id: string;
  person: Person;
  category: string;
  title: string;
  body: string;
  source_page: number;
};
export type Metric = {
  person: Person;
  key: string;
  label: string;
  unit: string;
  min_value: number;
  max_value: number;
};
export type TaskProgress = {
  person: Person;
  day: number;
  task_id: string;
  completed: boolean;
  actual: string;
  notes: string;
  updated_at: string;
};
export type MealProgress = {
  person: Person;
  day: number;
  slot_id: string;
  completed: boolean;
  notes: string;
  updated_at: string;
};
export type Measurement = {
  person: Person;
  day: number;
  metric: string;
  value: number;
  updated_at: string;
};
export type Checkin = {
  person: Person;
  week: number;
  energy: number | null;
  ankle_comfort: number | null;
  strength: string;
  notes: string;
  updated_at: string;
};
export type PlanData = {
  programs: Program[];
  days: PlanDay[];
  tasks: Task[];
  meals: Meal[];
  options: MealOption[];
  notes: Note[];
  metrics: Metric[];
};
export type ProgressData = {
  taskProgress: TaskProgress[];
  mealProgress: MealProgress[];
  measurements: Measurement[];
  checkins: Checkin[];
};

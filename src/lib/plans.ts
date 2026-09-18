// Human-readable transcription of the two supplied PDFs. See docs/PLAN_EXTRACTION.md.
import type { PlanData, Person, Task, PlanDay, Metric } from "./types";
import { sourceNotes } from "./source-notes";
const programs: PlanData["programs"] = [
  {
    id: "dhruv",
    name: "Dhruv",
    goal: "Bodyweight strength, stamina & fat loss",
    meal_basis: "weekday",
    source: "Dhruv's 30 Days Workout Plan · 7 pages",
  },
  {
    id: "annanya",
    name: "Annanya",
    goal: "Build strength & a sustainable training habit",
    meal_basis: "sequence",
    source: "Annanya's 4 Week Workout Plan · 9 pages",
  },
];
const days: PlanDay[] = [],
  tasks: Task[] = [];
type Item = [
  name: string,
  target: string,
  cue?: string,
  kind?: string,
  rest?: string,
  optional?: boolean,
];
function addDay(
  person: Person,
  day: number,
  title: string,
  focus: string,
  kind: PlanDay["kind"],
  items: Item[],
  instructions = "",
  page = 4,
) {
  days.push({
    person,
    day,
    week: Math.ceil(day / 7),
    title,
    focus,
    kind,
    instructions,
    source_page: page,
  });
  items.forEach(
    (
      [
        name,
        target,
        cue = "",
        taskKind = "exercise",
        rest = "",
        optional = false,
      ],
      i,
    ) =>
      tasks.push({
        id: `${person}-${day}-${i + 1}`,
        person,
        day,
        position: i + 1,
        name,
        target,
        cue,
        kind: taskKind,
        rest,
        optional,
        source_page: page,
      }),
  );
}
const dwarm: Item = [
  "Warm-up",
  "5–7 min",
  "March/easy jog in place; arm and hip circles; leg swings; ankle rotations; 10 bodyweight squats; 5–10 easy push-ups; dynamic mobility.",
  "warmup",
];
const mobility: Item = [
  "Mobility & stretching",
  "20–30 min",
  "Hips, calves, hamstrings, quadriceps, chest, shoulders and thoracic spine. Add an easy core circuit only if fresh.",
  "recovery",
];
const dA1: Item[] = [
  ["Push-ups", "3 × 8–12"],
  ["Pike push-ups", "3 × 6–10"],
  ["Wide push-ups", "2 × 10–15"],
  ["Close-grip push-ups", "2 × 6–10"],
  ["Plank", "2 × 30 sec"],
];
const dB1: Item[] = [
  ["Bodyweight squats", "4 × 15"],
  ["Reverse lunges", "3 × 10 / leg"],
  [
    "Stationary split squats",
    "3 × 10 / leg",
    "Bulgarian split squats only with a genuinely stable household surface.",
  ],
  ["Single-leg glute bridges", "3 × 12 / leg"],
  ["Calf raises", "4 × 20"],
];
const dC1: Item[] = [
  ["Prone Y-T-W raises", "3 × 8"],
  ["Reverse snow angels", "3 × 12"],
  ["Superman pull-downs", "3 × 12"],
  ["Dead bugs", "3 × 10 / side"],
  ["Reverse crunches", "3 × 12"],
];
const dA2: Item[] = [
  ["Push-ups", "4 × 10–15"],
  ["Pike push-ups", "4 × 8–12"],
  ["Wide push-ups", "3 × 12–15"],
  ["Close-grip push-ups", "3 × 8–12"],
  ["Plank", "3 × 40 sec"],
];
const dB2: Item[] = [
  ["Bodyweight squats", "4 × 20"],
  ["Reverse lunges", "4 × 12 / leg"],
  [
    "Stationary split squats",
    "3 × 12 / leg",
    "Per-leg convention from the template. Use a stable surface if choosing Bulgarian split squats.",
  ],
  ["Single-leg glute bridges", "3 × 15 / leg"],
  ["Calf raises", "4 × 25"],
];
const dC2: Item[] = [
  ...dC1.map((x) =>
    x[0] === "Superman pull-downs"
      ? (["Superman pull-downs", "4 × 12"] as Item)
      : x,
  ),
  ["Side plank", "3 × 30 sec / side"],
];
const dA3: Item[] = [
  ["Push-ups", "4 × 12–18"],
  ["Pike push-ups", "4 × 8–12"],
  ["Diamond push-ups", "3 × 8–12"],
  ["Slow push-ups", "3 × 6–10"],
];
const dB3: Item[] = [
  ["Slow bodyweight squats", "4 × 20"],
  ["Reverse lunges", "4 × 12 / leg"],
  ["Stationary split squats", "4 × 10–15 / leg"],
  [
    "Single-leg glute bridges",
    "4 × 15 / leg",
    "Per-leg convention from the template.",
  ],
];
const dC3: Item[] = [
  [
    "Prone Y-T-W raises",
    "4 rounds",
    "Repetitions are not specified for this day.",
  ],
  ["Reverse snow angels", "4 × 15"],
  ["Superman pull-downs", "4 × 15"],
  ["Reverse crunches", "3 × 15"],
  ["Side plank", "3 × 40 sec / side"],
];
const dA4: Item[] = [
  ["Push-ups", "5 sets", "Repetitions are not specified for peak week."],
  ["Pike push-ups", "4 sets", "Repetitions are not specified for peak week."],
  [
    "Diamond push-ups",
    "3 sets",
    "Repetitions are not specified for peak week.",
  ],
  ["Slow push-ups", "3 sets", "Repetitions are not specified for peak week."],
];
const dB4: Item[] = [
  ["Bodyweight squats", "5 × 20"],
  ["Reverse lunges", "4 × 15 / leg"],
  ["Stationary split squats", "4 × 12–15 / leg"],
  ["Single-leg glute bridges", "4 × 15 / leg"],
];
const circuit = (rounds: string, late = false): Item[] => [
  ["Circuit · Squats", `${rounds} rounds × ${late ? "20" : "15"}`],
  ["Circuit · Push-ups", `${rounds} rounds × ${late ? "12" : "8–12"}`],
  [
    "Circuit · Alternating reverse lunges",
    `${rounds} rounds × ${late ? "10" : "8"} / leg`,
  ],
  ["Circuit · Mountain climbers", `${rounds} rounds × ${late ? "30" : "20"}`],
  ["Circuit · Glute bridges", `${rounds} rounds × ${late ? "20" : "15"}`],
  [
    "Circuit · Plank shoulder taps",
    `${rounds} rounds × ${late ? "12" : "10"} / side`,
  ],
];
function d(
  day: number,
  code: string,
  run: string,
  items: Item[],
  instructions = "",
  kind: PlanDay["kind"] = "strength",
) {
  const focus: Record<string, string> = {
    A: "Push, chest & shoulders",
    B: "Legs & glutes",
    C: "Back, posture & core",
    D: "Full-body conditioning",
    Recovery: "Mobility & recovery",
    Benchmark: "Strength benchmark",
    Trial: "Running benchmark",
  };
  const cue =
    run === "intervals"
      ? "Within 3 km, alternate about 1 min fast / 1 min easy. Fast but controlled, not all-out sprints."
      : run === "progression"
        ? "Easy → moderate → hard across the 3 km."
        : day === 27
          ? "If legs feel unusually heavy, make the run very easy."
          : run === "time trial"
            ? "Warm up properly; record your time. Compare with the previous 17–20 min range. Do not do hard strength afterward."
            : "";
  addDay(
    "dhruv",
    day,
    ["Recovery", "Benchmark", "Trial"].includes(code)
      ? focus[code]
      : `Workout ${code}`,
    focus[code],
    kind,
    [
      ...(kind === "strength" || day === 29
        ? [dwarm]
        : day === 30
          ? [
              [
                "Warm-up",
                "Warm up properly before time trial",
                "",
                "warmup",
              ] as Item,
            ]
          : []),
      ["3 km run", `3 km · ${run}`, cue, "run"],
      ...items,
    ],
    instructions,
    day <= 21 ? 4 : 5,
  );
}
d(1, "A", "easy", dA1);
d(2, "B", "easy", dB1);
d(3, "C", "moderate", dC1);
d(4, "Recovery", "very easy", [mobility], "", "recovery");
d(
  5,
  "A",
  "easy",
  dA1,
  "Repeat Day 1; try adding 1 rep per set while preserving form.",
);
d(
  6,
  "B",
  "moderate",
  dB1,
  "Compared with Day 2, add 2–3 squat reps per set and 1 lunge rep per leg.",
);
d(7, "D", "easy", circuit("4"));
d(8, "A", "easy", dA2);
d(9, "B", "easy", dB2);
d(10, "C", "intervals", dC2);
d(11, "Recovery", "very easy", [mobility], "", "recovery");
d(
  12,
  "A",
  "easy",
  dA2,
  "Use a 3-second lowering phase on the final set of each push-up variation.",
);
d(13, "B", "moderate", [...dB2, ["Wall sit", "3 × 45–60 sec"]]);
d(14, "D", "easy", circuit("5"));
d(15, "A", "easy", dA3);
d(16, "B", "easy", dB3);
d(17, "C", "moderate", dC3);
d(18, "Recovery", "very easy", [mobility], "", "recovery");
d(19, "A", "progression", dA3);
d(20, "B", "easy", [
  ...dB3,
  ["Calf raises", "4 × 25"],
  ["Wall sit", "3 × 60 sec"],
]);
d(21, "D", "easy", circuit("5", true));
d(22, "A", "easy", dA4);
d(23, "B", "easy", dB4);
// Day 24 says “C: 4 rounds”, not a fully specified per-exercise progression.
d(
  24,
  "C",
  "intervals",
  [
    [
      "Prone Y-T-W raises",
      "Part of 4-round C session",
      "Repetitions not specified.",
    ],
    [
      "Reverse snow angels",
      "Part of 4-round C session",
      "Repetitions not specified.",
    ],
    [
      "Superman pull-downs",
      "Part of 4-round C session",
      "Repetitions not specified.",
    ],
    [
      "Reverse crunches",
      "Part of 4-round C session",
      "Repetitions not specified.",
    ],
    ["Side plank", "Part of 4-round C session", "Hold duration not specified."],
    ["Hollow-body hold", "3 × 30–45 sec"],
  ],
  "PDF: “C: 4 rounds + 3×30–45 sec hollow hold.” C exercise selection follows Day 17. Exact repetitions/holds are not supplied; the full C template is in Plan reference.",
);
d(
  25,
  "Recovery",
  "very easy",
  [mobility],
  "Mobility only after the run.",
  "recovery",
);
d(26, "A", "moderate", dA4, "Try to beat Day 22 by reps OR quality, not both.");
d(27, "B", "easy", [
  ...dB4,
  ["Wall sit", "Sets and hold duration not specified"],
]);
d(
  28,
  "D",
  "easy",
  circuit("5–6", true),
  "5–6 controlled rounds. Exercise repetitions follow the latest explicit circuit, Day 21.",
);
d(
  29,
  "Benchmark",
  "easy",
  [
    [
      "Push-up benchmark",
      "1 maximum-quality set",
      "Allow adequate recovery after the run. Rest 3–4 minutes after this set.",
      "benchmark",
    ],
    ["Pike push-ups", "3 × 10"],
    ["Stationary split squats", "3 × 15 / leg"],
    ["Superman pull-downs", "3 × 15"],
    ["Plank benchmark", "1 maximum hold", "Compare with Week 1.", "benchmark"],
  ],
  "Compare with Week 1.",
  "benchmark",
);
d(
  30,
  "Trial",
  "time trial",
  [
    ["Cooldown walk", "5–10 min", "", "recovery"],
    ["Easy mobility", "Easy mobility after the walk", "", "recovery"],
  ],
  "No hard strength workout after the time trial.",
  "benchmark",
);

const awarm: Item = [
  "Warm-up",
  "6–8 min",
  "1 min easy marching; 8 shoulder rolls each direction; 8 arm circles each direction; 8 hip hinges; 8 slow squats; 10 glute bridges; 8 gentle ankle circles each direction per ankle. Keep movements pain-free.",
  "warmup",
];
const acool: Item = [
  "Cooldown",
  "5 min",
  "Walk slowly 1–2 min, then gentle chest, back, quadriceps, hamstring and glute stretches for 20–30 sec each. Mild, not painful.",
  "recovery",
];
type AExercise = [string, string, string, string?];
const aTemplates: Record<string, AExercise[]> = {
  A: [
    [
      "Chair squat / goblet squat",
      "60–75 sec",
      "Sit back toward chair. Week 1: bodyweight if needed; progress to one 3 kg dumbbell at chest.",
    ],
    [
      "Dumbbell floor press",
      "60 sec",
      "Use 1–3 kg pair. Elbows about 30–45° from torso.",
    ],
    [
      "Glute bridge",
      "45–60 sec",
      "Drive through whole foot; squeeze glutes. Add a 3 kg dumbbell over hips when ready.",
    ],
    [
      "One-arm dumbbell row",
      "45 sec / side",
      "Support free hand on chair; neutral back; use 3 kg.",
      "side",
    ],
    [
      "Dumbbell Romanian deadlift",
      "60 sec",
      "3 kg pair; hips backward, soft knees, weights close to legs.",
    ],
    [
      "Dead bug",
      "45 sec",
      "Lower back gently pressed into mat; move slowly.",
      "core",
    ],
  ],
  B: [
    [
      "Supported split squat",
      "60 sec",
      "Hold chair lightly. Bodyweight first; shorten range if ankle uncomfortable. If it bothers the ankle, replace with chair squats.",
      "leg",
    ],
    [
      "One-arm dumbbell row",
      "45 sec / side",
      "3 kg; pull elbow toward hip and pause.",
      "side",
    ],
    [
      "Seated dumbbell shoulder press",
      "60 sec",
      "Sit tall; begin with 1 kg pair, progress with control.",
    ],
    ["Dumbbell biceps curl", "45 sec", "1–3 kg; keep elbows close to body."],
    ["Dumbbell triceps kickback", "45 sec", "1–3 kg; upper arm stays still."],
    [
      "Bird dog",
      "45 sec",
      "Reach opposite arm and leg without rotating hips.",
      "core",
    ],
  ],
  C: [
    [
      "Dumbbell sumo squat",
      "60–75 sec",
      "Hold one 3 kg dumbbell vertically; comfortable stance, knees track over toes.",
    ],
    [
      "Dumbbell floor press",
      "60 sec",
      "Controlled lowering; do not bounce upper arms off the floor.",
    ],
    [
      "Single-leg assisted glute bridge",
      "45 sec / side",
      "Use standard two-leg bridge if too difficult.",
      "side",
    ],
    [
      "Dumbbell lateral raise",
      "45 sec",
      "1 kg pair; comfortable shoulder height only.",
    ],
    ["Hammer curl", "45 sec", "Neutral grip; 1–3 kg."],
    [
      "Knee plank / full plank",
      "45 sec",
      "Brace abdomen and glutes; choose a version that keeps a straight line.",
      "hold",
    ],
  ],
  D: [
    [
      "Chair squat / goblet squat",
      "60 sec",
      "Controlled tempo; chair as depth guide.",
    ],
    [
      "Dumbbell Romanian deadlift",
      "60 sec",
      "3 kg pair; feel hamstrings and glutes, not lower back.",
    ],
    ["One-arm dumbbell row", "45 sec / side", "3 kg; slow lowering.", "side"],
    [
      "Standing dumbbell chest squeeze",
      "45 sec",
      "Press dumbbells together at chest; maintain inward pressure.",
    ],
    [
      "Calf raise with chair support",
      "45 sec",
      "Only if pain-free and stable. Slow up/down. If painful or unstable, skip and do an extra set of glute bridges.",
    ],
  ],
};
const aProgress = [
  {
    sets: 2,
    reps: "8–10",
    core: "6",
    hold: "15–20",
    steps: "3,000–4,000",
    rounds: 2,
    seconds: 30,
    sits: 8,
    rest: "60 sec",
    cue: "Learn the movements.",
  },
  {
    sets: 3,
    reps: "8–12",
    core: "8",
    hold: "20–25",
    steps: "4,000–5,000",
    rounds: 3,
    seconds: 40,
    sits: 10,
    rest: "60 sec",
    cue: "Build volume with clean technique.",
  },
  {
    sets: 3,
    reps: "10–15",
    core: "10",
    hold: "25–35",
    steps: "5,000–6,000",
    rounds: 3,
    seconds: 45,
    sits: 12,
    rest: "45–60 sec",
    cue: "Lower each rep for approximately 3 seconds where safe.",
  },
  {
    sets: 3,
    reps: "12–15",
    core: "10–12",
    hold: "30–45",
    steps: "Around 6,000+",
    rounds: 4,
    seconds: 45,
    sits: 12,
    rest: "45 sec",
    cue: "Add a 1–2 sec pause at the hardest point on selected exercises. Keep clean technique.",
  },
];
for (let day = 1; day <= 28; day++) {
  const w = Math.floor((day - 1) / 7),
    p = aProgress[w],
    code = ["A", "B", "Recovery", "C", "Recovery", "D", "Rest"][(day - 1) % 7];
  const steps: Item = [
    "Walking / steps",
    `${p.steps} steps/day average`,
    w === 3
      ? "Only if the ankle tolerates it."
      : "Weekly daily-average target; keep ankle comfortable.",
    "steps",
  ];
  if (code === "Rest") {
    addDay(
      "annanya",
      day,
      "Full rest",
      "Space to recover",
      "rest",
      [
        ["Full recovery", "Rest from strength training", "", "rest"],
        [steps[0], steps[1], steps[2], steps[3], "", true],
      ],
      "The weekly step target is contextual on a full-rest day; it is optional for daily completion.",
      6,
    );
    continue;
  }
  if (code === "Recovery") {
    addDay(
      "annanya",
      day,
      "Recovery + steps",
      "Walking & mobility",
      "recovery",
      [
        steps,
        [
          "Gentle mobility",
          "Pain-free mobility",
          "No duration is specified for ordinary recovery days.",
          "recovery",
        ],
      ],
      "",
      6,
    );
    continue;
  }
  const focus: Record<string, string> = {
    A: "Glutes, chest & full body",
    B: "Back, legs & arms",
    C: "Glutes, chest & arms",
    D: "Legs, back & conditioning",
  };
  const items: Item[] = aTemplates[code].map(([name, rest, cue, mode]) => [
    name,
    `${p.sets} × ${mode === "core" ? p.core + " / side" : mode === "hold" ? p.hold + " sec" : p.reps + (mode === "side" ? " / side" : mode === "leg" ? " / leg" : "")}`,
    cue,
    "exercise",
    rest,
  ]);
  if (code === "D")
    items.push([
      "Low-impact conditioning",
      `${p.rounds} rounds`,
      `${p.seconds} sec marching + ${p.sits} sit-to-stands + ${p.seconds} sec ${w === 0 ? "light " : ""}shadow boxing. No jumping. Replace marching with seated fast punches if weight-bearing is uncomfortable.`,
      "conditioning",
      p.rest,
    ]);
  addDay(
    "annanya",
    day,
    `Workout ${code}`,
    focus[code],
    "strength",
    [awarm, ...items, acool, steps],
    p.cue + " End most sets with 2–3 clean reps still possible.",
    6,
  );
}
addDay(
  "annanya",
  29,
  "Progress check",
  "Notice how far you have come",
  "benchmark",
  [
    [
      "Chair squat benchmark",
      "Maximum comfortable reps in 60 sec",
      "Do not push to failure.",
      "benchmark",
    ],
    [
      "Push-up benchmark",
      "Maximum clean knee or standard push-ups",
      "Do not push to failure.",
      "benchmark",
    ],
    [
      "Plank benchmark",
      "Record hold time",
      "Do not push to failure.",
      "benchmark",
    ],
    [
      "Walking tolerance",
      "Record brisk walking time",
      "Stop the benchmark when noticeably winded.",
      "benchmark",
    ],
    ["Easy walk", "Easy walk", "", "recovery"],
    [
      "Progress reflection",
      "Energy, confidence, sleep, ankle comfort & clothes fit",
      "Body weight is optional. Record your reflection in the actual/notes field.",
      "reflection",
    ],
  ],
  "Repeat benchmarks without pushing to failure.",
  6,
);
addDay(
  "annanya",
  30,
  "Mobility & reflection",
  "Recover, reflect & look ahead",
  "recovery",
  [
    ["Easy walk", "Easy walk", "", "recovery"],
    [
      "Warm-up mobility sequence",
      "Repeat the warm-up mobility",
      awarm[2],
      "recovery",
    ],
    ["Gentle stretching", "10–15 min", "", "recovery"],
    [
      "Reflection",
      "What became easier?",
      "Write which exercises became easier and what to improve in the next training block.",
      "reflection",
    ],
  ],
  "",
  6,
);
const meals: PlanData["meals"] = [],
  options: PlanData["options"] = [];
const dMenus = [
  [
    "Oats + milk + banana + 3 eggs",
    "Rice + about 200 g chicken + dal + vegetables + curd",
  ],
  [
    "Oats + milk + banana + roasted chana",
    "Rice + 75–100 g dry soy chunks + dal + vegetables + curd",
  ],
  [
    "Rice/roti + 3 eggs + banana + curd",
    "Rice + about 200 g chicken + dal + vegetables",
  ],
  [
    "Oats + milk + banana + peanuts",
    "Rice + soy-chunk curry + dal + vegetables + curd",
  ],
  ["Oats + milk + 3 eggs + banana", "Rice + chicken + dal + vegetables + curd"],
  [
    "Rice/roti + dal + curd + banana",
    "Rice + 75–100 g soy chunks + dal + mixed vegetables",
  ],
  ["Oats + milk + banana + 3 eggs", "Rice + chicken + dal + vegetables + curd"],
];
const aMenus = [
  [
    "Besan chilla + curd",
    "Roti + sabzi + dal",
    "Banana + curd",
    "Paneer bhurji + roti + salad",
  ],
  [
    "Oats + milk + fruit",
    "Rice + rajma + salad",
    "Fruit + milk",
    "Roti + mixed veg + dal",
  ],
  [
    "Poha + curd",
    "Roti + chole + vegetables",
    "Roasted chana + fruit",
    "Khichdi + curd + vegetables",
  ],
  [
    "Moong chilla + curd",
    "Roti + sabzi + dal",
    "Banana + milk",
    "Tofu/paneer curry + roti",
  ],
  [
    "Upma + curd",
    "Rice + dal + vegetables + curd",
    "Fruit + curd",
    "Roti + soy-chunk curry + salad",
  ],
  [
    "Paneer/tofu sandwich + fruit",
    "Roti + rajma/chole + salad",
    "Banana + curd",
    "Dal + roti/rice + vegetables",
  ],
  [
    "Oats/poha + milk or curd",
    "Family meal: keep a protein source + vegetables",
    "Optional if hungry",
    "Simple roti + sabzi + dal/curd",
  ],
];
const aChoices = [
  [
    "Vegetable poha/upma + curd",
    "Oats made with milk + fruit",
    "2 besan/moong chillas + curd",
    "Paneer/tofu sandwich",
  ],
  [
    "2–3 rotis + sabzi + dal",
    "Roti + rajma/chole + salad",
    "Rice + dal + vegetables + curd",
  ],
  [
    "Banana + curd",
    "Fruit + milk",
    "Small poha/upma",
    "1 roti with light sabzi if it fits your schedule",
  ],
  [
    "Roti + sabzi + dal",
    "Paneer/tofu bhurji + roti + vegetables",
    "Soy-chunk curry + roti/rice",
    "Khichdi + curd + vegetables",
  ],
  [
    "Fruit",
    "Roasted chana",
    "Curd",
    "Milk",
    "Sprouts chaat",
    "Small handful of nuts",
  ],
];
for (const person of ["dhruv", "annanya"] as const) {
  const menus = person === "dhruv" ? dMenus : aMenus;
  menus.forEach((row, i) => {
    const all =
      person === "annanya"
        ? [...row, "Only when genuinely hungry or meals are far apart"]
        : row;
    all.forEach((menu, j) => {
      const id = `${person}-meal-${i + 1}-${j + 1}`;
      const label =
        person === "dhruv"
          ? ["Meal 1 · Pre-training", "Meal 2 · Post-training"][j]
          : [
              "Breakfast",
              "Lunch",
              "Pre-workout / snack",
              "Dinner",
              "Optional snack",
            ][j];
      const notes =
        person === "dhruv"
          ? j === 0
            ? "12:00–12:30 AM. Keep easy to digest; avoid overly oily or excessively large meals."
            : "4:30–5:00 AM. This may be the larger meal."
          : [
              "Add milk/curd or a small serving of paneer/tofu if mostly carbohydrate.",
              "Add dal, beans, curd, paneer or tofu; do not stop at roti + sabzi.",
              "60–120 min before training. Keep comfortable and not overly heavy.",
              "Prioritize a protein-rich item after training.",
              "Use when hungry or when meals are far apart.",
            ][j];
      meals.push({
        id,
        person,
        rotation_day: i + 1,
        position: j + 1,
        label,
        menu,
        optional: person === "annanya" && (j === 4 || (i === 6 && j === 2)),
        notes,
      });
      if (person === "annanya")
        aChoices[j].forEach((description, k) =>
          options.push({
            id: `${id}-option-${k + 1}`,
            slot_id: id,
            position: k + 1,
            description,
          }),
        );
    });
  });
}
const metrics: Metric[] = [];
function metric(
  person: Person,
  key: string,
  label: string,
  unit: string,
  max_value: number,
  min_value = 0,
) {
  metrics.push({ person, key, label, unit, min_value, max_value });
}
metric("dhruv", "weight", "Morning body weight", "kg", 500);
metric("dhruv", "waist", "Waist at navel", "cm", 300);
metric("dhruv", "run_time", "3 km time", "minutes", 300);
metric("dhruv", "pushups", "Quality push-ups", "reps", 1000);
metric("dhruv", "plank", "Plank hold", "seconds", 7200);
metric("annanya", "steps", "Daily steps", "steps", 100000);
metric("annanya", "chair_squats", "Chair squats in 60 seconds", "reps", 300);
metric("annanya", "pushups", "Clean push-ups", "reps", 1000);
metric("annanya", "plank", "Plank hold", "seconds", 7200);
metric("annanya", "walk_time", "Brisk walk before winded", "minutes", 600);
metric("annanya", "weight", "Body weight · optional", "kg", 500);
export const plan: PlanData = {
  programs,
  days,
  tasks,
  meals,
  options,
  notes: sourceNotes,
  metrics,
};

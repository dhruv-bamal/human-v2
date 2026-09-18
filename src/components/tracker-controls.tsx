"use client";
import { useState, useTransition } from "react";
import { Check, LoaderCircle, Clock3 } from "lucide-react";
import {
  saveTask,
  saveMeal,
  saveMeasurement,
  saveCheckin,
  setStart,
  type Result,
} from "@/app/actions";
import type {
  Task,
  TaskProgress,
  Meal,
  MealOption,
  MealProgress,
  Person,
  Metric,
  Checkin,
} from "@/lib/types";
function useSave() {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<Result | null>(null);
  function run(action: () => Promise<Result>) {
    start(async () => {
      try {
        setStatus(await action());
      } catch {
        setStatus({
          ok: false,
          message:
            "Connection interrupted. Your change was not confirmed. Please retry.",
        });
      }
    });
  }
  return { pending, status, run };
}
function Status({ status }: { status: Result | null }) {
  return status ? (
    <p className={`form-status ${status.ok ? "" : "error-text"}`} role="status">
      {status.message}
    </p>
  ) : null;
}
export function TaskCard({
  task,
  progress,
  editable,
}: {
  task: Task;
  progress?: TaskProgress;
  editable: boolean;
}) {
  const { pending, status, run } = useSave();
  const [actual, setActual] = useState(progress?.actual || "");
  const [notes, setNotes] = useState(progress?.notes || "");
  const completed = progress?.completed || false;
  const save = (next: boolean) =>
    saveTask({
      person: task.person,
      day: task.day,
      task_id: task.id,
      completed: next,
      actual,
      notes,
    });
  return (
    <article className={`task-card ${completed ? "done" : ""}`}>
      <div className="task-top">
        <button
          className={`check ${completed ? "checked" : ""}`}
          aria-label={`${completed ? "Unmark" : "Complete"} ${task.name}`}
          aria-pressed={completed}
          disabled={!editable || pending}
          onClick={() => run(() => save(!completed))}
        >
          {pending ? (
            <LoaderCircle size={15} />
          ) : completed ? (
            <Check size={17} />
          ) : null}
        </button>
        <div className="task-main">
          <h3>{task.name}</h3>
          <p className="task-target">{task.target}</p>
          <div className="task-meta">
            {task.rest && (
              <span>
                <Clock3
                  size={12}
                  style={{ display: "inline", verticalAlign: "middle" }}
                />{" "}
                Rest {task.rest}
              </span>
            )}
            {task.optional && (
              <span>Optional · not required for completion</span>
            )}
          </div>
        </div>
      </div>
      <details className="task-details">
        <summary>
          {editable ? "Instructions & log results" : "Instructions & results"}
        </summary>
        {task.cue && <p>{task.cue}</p>}
        {editable ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => save(completed));
            }}
          >
            <label>
              Actual performance
              <input
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                maxLength={500}
                placeholder="Reps by set, time, distance or steps"
              />
            </label>
            <label>
              Notes · shared with your partner
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="How did it feel? Any modifications?"
              />
            </label>
            <button className="button small" disabled={pending}>
              Save results
            </button>
          </form>
        ) : (
          <>
            <p>{progress?.actual || "No performance logged yet."}</p>
            {progress?.notes && <p>{progress.notes}</p>}
          </>
        )}
      </details>
      <Status status={status} />
    </article>
  );
}
export function MealCard({
  meal,
  options,
  progress,
  day,
  editable,
}: {
  meal: Meal;
  options: MealOption[];
  progress?: MealProgress;
  day: number;
  editable: boolean;
}) {
  const { pending, status, run } = useSave();
  const [notes, setNotes] = useState(progress?.notes || "");
  const completed = progress?.completed || false;
  const save = (next: boolean) =>
    saveMeal({
      person: meal.person,
      day,
      slot_id: meal.id,
      completed: next,
      notes,
    });
  return (
    <article className="meal-card">
      <div className="meal-heading">
        <span className="eyebrow">
          {meal.label}
          {meal.optional ? " · optional" : ""}
        </span>
        <button
          className={`check ${completed ? "checked" : ""}`}
          aria-pressed={completed}
          aria-label={`${completed ? "Unmark" : "Complete"} ${meal.label}`}
          disabled={!editable || pending}
          onClick={() => run(() => save(!completed))}
        >
          {pending ? (
            <LoaderCircle size={15} />
          ) : completed ? (
            <Check size={17} />
          ) : null}
        </button>
      </div>
      <p className="menu">{meal.menu}</p>
      <p className="muted">{meal.notes}</p>
      <details>
        <summary>{options.length ? "Choices & notes" : "Meal notes"}</summary>
        {options.length > 0 && (
          <>
            <p className="muted">
              Choose one if you want an alternative to today’s menu.
            </p>
            <ul>
              {options.map((o) => (
                <li key={o.id}>{o.description}</li>
              ))}
            </ul>
          </>
        )}
        {editable ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => save(completed));
            }}
          >
            <label>
              Notes · shared with your partner
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="Your choice or any substitutions"
              />
            </label>
            <button className="button small" disabled={pending}>
              Save note
            </button>
          </form>
        ) : (
          <p className="muted">{progress?.notes || "No meal notes yet."}</p>
        )}
      </details>
      <Status status={status} />
    </article>
  );
}
export function StartForm({ today }: { today: string }) {
  const { pending, status, run } = useSave();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        run(() => setStart(f.get("start")));
      }}
    >
      <label>
        Start date
        <input
          type="date"
          name="start"
          min={today}
          defaultValue={today}
          required
        />
      </label>
      <button className="button primary" disabled={pending}>
        Set start date
      </button>
      <Status status={status} />
    </form>
  );
}
export function MeasurementForm({
  person,
  day,
  metrics,
}: {
  person: Person;
  day: number;
  metrics: Metric[];
}) {
  const { pending, status, run } = useSave();
  const [key, setKey] = useState(metrics[0]?.key || "");
  const metric = metrics.find((m) => m.key === key)!;
  return (
    <form
      className="metrics-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        run(() =>
          saveMeasurement({
            person,
            day,
            metric: key,
            value: Number(f.get("value")),
          }),
        );
      }}
    >
      <label>
        Measurement
        <select value={key} onChange={(e) => setKey(e.target.value)}>
          {metrics.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Value ({metric.unit})
        <input
          key={key}
          name="value"
          type="number"
          min={metric.min_value}
          max={metric.max_value}
          step={
            metric.unit === "reps" || metric.unit === "steps" ? "1" : "0.01"
          }
          required
        />
      </label>
      <button className="button primary" disabled={pending}>
        Save for Day {day}
      </button>
      <Status status={status} />
    </form>
  );
}
export function CheckinForm({
  week,
  checkin,
  editable,
}: {
  week: number;
  checkin?: Checkin;
  editable: boolean;
}) {
  const { pending, status, run } = useSave();
  if (!editable)
    return (
      <div className="activity">
        {checkin ? (
          <>
            <p>Energy: {checkin.energy ?? "Not logged"} / 5</p>
            <p>Ankle comfort: {checkin.ankle_comfort ?? "Not logged"} / 5</p>
            <p>Strength feels: {checkin.strength || "Not logged"}</p>
            <p>{checkin.notes || "No notes yet."}</p>
          </>
        ) : (
          <p className="empty">No check-in recorded for this week.</p>
        )}
      </div>
    );
  return (
    <form
      className="checkin-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const num = (k: string) => (f.get(k) ? Number(f.get(k)) : null);
        run(() =>
          saveCheckin({
            person: "annanya",
            week,
            energy: num("energy"),
            ankle_comfort: num("ankle"),
            strength: f.get("strength"),
            notes: f.get("notes"),
          }),
        );
      }}
    >
      <div className="two-fields">
        <label>
          Energy (1–5)
          <input
            name="energy"
            type="number"
            min={1}
            max={5}
            step={1}
            defaultValue={checkin?.energy ?? ""}
          />
        </label>
        <label>
          Ankle comfort (1–5)
          <input
            name="ankle"
            type="number"
            min={1}
            max={5}
            step={1}
            defaultValue={checkin?.ankle_comfort ?? ""}
          />
        </label>
      </div>
      <label>
        Strength feels
        <input
          name="strength"
          maxLength={500}
          defaultValue={checkin?.strength || ""}
        />
      </label>
      <label>
        Weekly notes · shared
        <textarea
          name="notes"
          maxLength={2000}
          defaultValue={checkin?.notes || ""}
        />
      </label>
      <button className="button" disabled={pending}>
        Save Week {week} check-in
      </button>
      <Status status={status} />
    </form>
  );
}

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChartNoAxesColumn,
  ChevronRight,
  Dumbbell,
  Footprints,
  Flame,
  House,
  LockKeyhole,
  LogOut,
  Utensils,
  Eye,
  ShieldCheck,
} from "lucide-react";
import type { DashboardData } from "@/lib/load";
import type { Person, Profile, Note } from "@/lib/types";
import {
  addDays,
  canEditDay,
  displayDate,
  programStatus,
  rotationDay,
} from "@/lib/dates";
import { daySummary, overall } from "@/lib/domain";
import { logout } from "@/app/actions";
import {
  TaskCard,
  MealCard,
  StartForm,
  MeasurementForm,
  CheckinForm,
} from "./tracker-controls";
const names = { dhruv: "Dhruv", annanya: "Annanya" };
const views = ["overview", "exercise", "meals", "progress"] as const;
export type View = (typeof views)[number];
export function Dashboard({
  data,
  person,
  day,
  view = "overview",
  isToday = false,
  preview = false,
}: {
  data: DashboardData;
  person: Person;
  day: number;
  view?: View;
  isToday?: boolean;
  preview?: boolean;
}) {
  const { plan, profiles, progress, viewer, zone } = data;
  const today = data.trainingToday[person];
  const profile = profiles.find((p) => p.id === person)!;
  const partner = profiles.find((p) => p.id !== person)!;
  const own = viewer.id === person;
  const editable =
    own && !preview && canEditDay(profile.start_date, day, today);
  const status = programStatus(profile.start_date, today);
  const program = plan.programs.find((p) => p.id === person)!;
  const selected = plan.days.find((d) => d.person === person && d.day === day)!;
  const summary = daySummary(plan, progress, profile, day, today),
    totals = overall(plan, progress, profile, today);
  const rotation = rotationDay(person, day, profile.start_date);
  const tasks = plan.tasks
    .filter((t) => t.person === person && t.day === day)
    .sort((a, b) => a.position - b.position);
  const meals = plan.meals
    .filter((m) => m.person === person && m.rotation_day === rotation)
    .sort((a, b) => a.position - b.position);
  const href = (p: Person, v: View, d?: number) =>
    preview
      ? `/dev-preview?person=${p}&view=${v}&day=${d || day}`
      : `/app/${p}/${v}${d ? "?day=" + d : ""}`;
  const workout = (
    <section className="panel" id="session">
      <div className="panel-title">
        <h2>
          {selected.kind === "rest" ? "Today’s recovery" : "Your session"}
        </h2>
        <span className="count">
          {summary.taskDone} / {summary.tasks} done
        </span>
      </div>
      {selected.instructions && (
        <p className="notice" style={{ marginBottom: 18 }}>
          {selected.instructions}
        </p>
      )}
      {person === "dhruv" && selected.kind === "strength" && (
        <p className="footnote" style={{ marginBottom: 15 }}>
          Controlled reps. Lower for 2–3 seconds; Rest 60–90 sec, up to 2 min
          after difficult sets. Leave 1–3 good reps in reserve.
        </p>
      )}
      {person === "annanya" && (
        <p className="notice" style={{ marginBottom: 18 }}>
          Keep the ankle comfortable. Stop for pain, swelling or instability.
          Substitutions are inside each exercise.
        </p>
      )}
      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            editable={editable}
            progress={progress.taskProgress.find((p) => p.task_id === task.id)}
          />
        ))}
      </div>
    </section>
  );
  const mealPanel = (
    <section className="panel" id="meals">
      <div className="panel-title">
        <h2>On the menu</h2>
        <span className="count">
          {summary.mealDone} / {summary.meals} done
        </span>
      </div>
      <p className="footnote" style={{ margin: "0 0 16px" }}>
        {person === "dhruv"
          ? rotation && [2, 4, 6].includes(rotation)
            ? "Vegetarian today · based on the actual weekday."
            : "Three feedings, one training day. Menus follow the evening date’s weekday."
          : "Vegetarian, with room for choice. Optional snacks don’t affect completion."}
      </p>
      {!rotation ? (
        <p className="empty">
          Set your start date to show the correct weekday menu. Tuesday,
          Thursday and Saturday are always vegetarian.
        </p>
      ) : (
        meals.map((meal) => (
          <MealCard
            key={`${day}-${meal.id}`}
            meal={meal}
            recipes={data.linkedRecipes.filter((r) => r.slot_id === meal.id)}
            trainingDayDate={
              profile.start_date ? addDays(profile.start_date, day - 1) : null
            }
            options={plan.options.filter((o) => o.slot_id === meal.id)}
            progress={progress.mealProgress.find(
              (p) =>
                p.person === person && p.day === day && p.slot_id === meal.id,
            )}
            day={day}
            editable={editable}
          />
        ))
      )}
      {person === "dhruv" ? (
        <p className="notice">
          Budget ceiling: ₹100–150/day. Choose seasonal produce; reduce sausages
          first if the basket is too expensive. Vegetarian days contain no eggs
          or chicken sausages. Keep peanut-butter portions moderate.
        </p>
      ) : (
        <p className="notice">
          At lunch and dinner: about ¼ plate protein, ¼ roti/rice or other
          carbohydrate, and ½ vegetables/salad. Eat enough to recover; no
          calorie counting required.
        </p>
      )}
    </section>
  );
  return (
    <>
      {preview && (
        <div className="preview-banner">
          Local design review · extracted plans, zero recorded activity ·
          tracking disabled
        </div>
      )}
      <div className={`app-shell ${person}`}>
        <a className="skip-link" href="#main">
          Skip to tracker
        </a>
        <aside className="sidebar">
          <Link
            className="wordmark"
            href={preview ? "/dev-preview" : "/app/today"}
          >
            together<span>/ thirty</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link
              className={`nav-link ${isToday ? "active" : ""}`}
              href={preview ? "/dev-preview" : "/app/today"}
            >
              <House size={18} />
              <span>Today</span>
            </Link>
            <span className="eyebrow">Your spaces</span>
            {(["dhruv", "annanya"] as const).map((p) => (
              <Link
                key={p}
                className={`nav-link ${p === person && !isToday ? "active" : ""}`}
                href={href(p, "overview")}
              >
                <span className={`avatar ${p}`}>{names[p][0]}</span>
                <span>{names[p]}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-foot">
            <p>
              <LockKeyhole
                size={14}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              A private space for two.
            </p>
            {!preview && (
              <form action={logout}>
                <button>
                  <LogOut size={16} /> Sign out
                </button>
              </form>
            )}
          </div>
        </aside>
        <div className="app-main">
          <header className="topbar">
            <div>
              <span className="muted">Your training journal</span>
            </div>
            <div className="private">
              <ShieldCheck size={15} />
              <span className="private-copy">Private & shared</span>
              <span>·</span>
              <span>{names[viewer.id]}</span>
              <span className={`avatar ${viewer.id}`}>
                {names[viewer.id][0]}
              </span>
            </div>
          </header>
          <main className="content" id="main">
            <div className="heading-row">
              <div>
                <span className="eyebrow muted">
                  {isToday ? displayDate(today) : program.goal}
                </span>
                <h1>
                  {isToday
                    ? `A little stronger, ${names[person]}.`
                    : `${names[person]}’s space.`}
                </h1>
                <p className="muted">
                  {status.state === "not_started"
                    ? profile.start_date
                      ? `Your program starts ${displayDate(profile.start_date)}.`
                      : "Your next 30 days, one step at a time."
                    : status.state === "completed"
                      ? "Your 30-day program window is complete. Your journal stays here."
                      : `Day ${status.day} of 30 · ${status.day > 28 ? "Final check-in" : `Week ${Math.ceil(status.day / 7)}`} · ${program.goal}`}
                </p>
              </div>
              <span className={`mode-badge ${own ? "" : "readonly"}`}>
                {own ? <ShieldCheck size={14} /> : <Eye size={14} />}{" "}
                {own ? "Your tracker" : `Viewing ${names[person]} · Read only`}
              </span>
            </div>
            <nav className="tabs" aria-label="Profile sections">
              {views.map((v) => (
                <Link
                  key={v}
                  aria-current={view === v ? "page" : undefined}
                  className={view === v ? "active" : ""}
                  href={href(person, v, day)}
                >
                  {
                    {
                      overview: "Overview",
                      exercise: "Exercise tracker",
                      meals: "Meal tracker",
                      progress: "Progress",
                    }[v]
                  }
                </Link>
              ))}
            </nav>
            {!profile.start_date && (
              <section className="start-panel">
                <div>
                  <h3>
                    {own
                      ? "Choose your first day."
                      : `${names[person]} hasn’t set a start date yet.`}
                  </h3>
                  <p>
                    {own
                      ? "Your start date anchors the full program. Once set, it stays fixed."
                      : "You can explore the plan while they get ready."}
                  </p>
                </div>
                {own && !preview && <StartForm today={today} />}
              </section>
            )}
            {!editable && profile.start_date && (
              <p className="notice" style={{ marginBottom: 20 }}>
                {!own
                  ? `${names[person]}’s progress is shared with you. Only they can edit it.`
                  : preview
                    ? "Design preview — tracking is disabled."
                    : `Upcoming day · available to track on ${displayDate(addDays(profile.start_date, day - 1))}.`}
              </p>
            )}
            <div className="day-toolbar">
              <div className="day-nav">
                {day > 1 ? (
                  <Link
                    aria-label="Previous day"
                    className="icon-button"
                    href={href(person, view, day - 1)}
                  >
                    <ArrowLeft size={16} />
                  </Link>
                ) : (
                  <span className="icon-button muted" aria-hidden="true">
                    <ArrowLeft size={16} />
                  </span>
                )}
                <strong>Day {day} of 30</strong>
                {day < 30 ? (
                  <Link
                    aria-label="Next day"
                    className="icon-button"
                    href={href(person, view, day + 1)}
                  >
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <span className="icon-button muted" aria-hidden="true">
                    <ArrowRight size={16} />
                  </span>
                )}
                <span className="muted date-label">
                  {profile.start_date
                    ? displayDate(addDays(profile.start_date, day - 1))
                    : "Start date not set"}
                </span>
              </div>
              <Link className="current" href={href(person, view, status.day)}>
                Back to today
              </Link>
            </div>
            {view !== "progress" && (
              <section className="summary-grid">
                <div className="hero-card">
                  <div>
                    <span className="eyebrow">
                      {day > 28
                        ? "The final chapter"
                        : `Week ${selected.week} / ${person === "annanya" ? ["Learn", "Build", "Progress", "Challenge"][selected.week - 1] : ["Foundation", "Build volume", "Strength emphasis", "Peak week"][selected.week - 1]}`}
                    </span>
                    <h2>{selected.title}</h2>
                    <p>{selected.focus}</p>
                    <div className="hero-targets">
                      {tasks
                        .filter((t) => t.kind === "run" || t.kind === "steps")
                        .map((t) => (
                          <span key={t.id}>
                            <Footprints size={14} />
                            {t.target}
                          </span>
                        ))}
                      <span>
                        <Dumbbell size={14} />
                        {selected.kind === "rest"
                          ? "Full rest"
                          : selected.kind === "recovery"
                            ? "Recovery"
                            : `${summary.tasks} session tasks`}
                      </span>
                    </div>
                    <a
                      className="session-link"
                      href={view === "meals" ? "#meals" : "#session"}
                    >
                      {view === "meals"
                        ? "Open meal checklist"
                        : "Open session checklist"}{" "}
                      <ArrowRight size={15} />
                    </a>
                  </div>
                  <div className="hero-day">
                    {String(day).padStart(2, "0")}
                    <span>OF 30 DAYS</span>
                  </div>
                </div>
                <div className="summary-side">
                  <Meter
                    label="Session"
                    done={summary.taskDone}
                    total={summary.tasks}
                  />
                  <Meter
                    label="Meals"
                    done={summary.mealDone}
                    total={summary.meals}
                  />
                  <Meter
                    label="Your 30 days"
                    done={totals.completed}
                    total={30}
                  />
                </div>
              </section>
            )}
            {(view === "overview" || view === "progress") && (
              <div className="stats-row">
                <Stat
                  icon={<CalendarDays size={15} />}
                  label="Days completed"
                  value={`${totals.completed} / 30`}
                  note="Session + planned meals"
                />
                <Stat
                  icon={<Dumbbell size={15} />}
                  label="Strength sessions"
                  value={`${totals.workouts} / ${totals.workoutTotal}`}
                  note="Recovery tracked separately"
                />
                <Stat
                  icon={<Utensils size={15} />}
                  label="Meals completed"
                  value={String(totals.meals)}
                  note="Optional snacks excluded"
                />
                <Stat
                  icon={<Flame size={15} />}
                  label="Current streak"
                  value={`${totals.streak} ${totals.streak === 1 ? "day" : "days"}`}
                  note={`Best streak · ${totals.longest} days`}
                />
              </div>
            )}
            <details
              className="calendar-card"
              open={view === "overview" || view === "progress"}
            >
              <summary className="calendar-summary">
                Choose a program day
              </summary>
              <div className="section-heading">
                <h2>The 30-day view</h2>
                <p>{totals.percent}% complete</p>
              </div>
              <div className="calendar">
                {plan.days
                  .filter((d) => d.person === person)
                  .map((d) => {
                    const r = totals.rows[d.day - 1];
                    const state = r.complete
                      ? "Completed"
                      : r.started
                        ? "In progress"
                        : !r.eligible
                          ? "Upcoming"
                          : "Not started";
                    return (
                      <Link
                        key={d.day}
                        href={href(person, view, d.day)}
                        aria-current={day === d.day ? "date" : undefined}
                        aria-label={`Day ${d.day}: ${d.title}, ${state}`}
                        title={`${d.title} · ${state}`}
                        className={`${day === d.day ? "selected" : ""} ${r.complete ? "complete" : r.started ? "inprogress" : !r.eligible ? "future" : ""} ${d.kind}`}
                      >
                        {r.complete ? <Check size={16} /> : d.day}
                      </Link>
                    );
                  })}
              </div>
              <div className="legend">
                <span>
                  <i className="done" />
                  Completed
                </span>
                <span>
                  <i className="partial" />
                  In progress
                </span>
                <span>
                  <i />
                  Recovery / rest underlined
                </span>
                <span>Dashed · upcoming</span>
              </div>
            </details>
            {view === "overview" ? (
              <div className="work-grid">
                <div>{workout}</div>
                <div>
                  {mealPanel}
                  <Partner
                    profile={partner}
                    data={data}
                    href={href(partner.id, "overview")}
                  />
                </div>
              </div>
            ) : view === "exercise" ? (
              <div className="work-grid">
                <div>{workout}</div>
                <div>
                  <Partner
                    profile={partner}
                    data={data}
                    href={href(partner.id, "overview")}
                  />
                  <div className="panel" style={{ marginTop: 22 }}>
                    <h3>Keep the long view.</h3>
                    <p className="footnote">
                      {person === "dhruv"
                        ? "Most runs should be comfortable enough to speak in short sentences. Save hard efforts for designated sessions."
                        : "Clean repetitions and ankle comfort come first. On an unusually demanding day, do the first four exercises for two sets each, then return to the schedule next session."}
                    </p>
                    <p className="footnote">
                      Use results and notes to record a shortened session or
                      substitutions.
                    </p>
                  </div>
                </div>
              </div>
            ) : view === "meals" ? (
              <div className="work-grid">
                <div>{mealPanel}</div>
                <div>
                  <Partner
                    profile={partner}
                    data={data}
                    href={href(partner.id, "overview")}
                  />
                  {person === "dhruv" && (
                    <KitchenGuide
                      notes={plan.notes.filter(
                        (n) => n.person === person && n.category === "kitchen",
                      )}
                    />
                  )}
                  <div className="panel" style={{ marginTop: 22 }}>
                    <h3>Fuel the work.</h3>
                    <p className="footnote">
                      {person === "dhruv"
                        ? "11 PM Meal 1 → 12:20–12:30 AM small shake/snack → 1–3 AM run and workout → 4 AM Meal 2. These belong to the evening’s training day, which rolls over at 5 AM. Protect the 5 AM–1 PM sleep block."
                        : "Include a clear protein source at 2–3 eating occasions daily. Keep convenient milk, curd, fruit, roasted chana or paneer/tofu sandwiches available when busy."}
                    </p>
                    <p className="footnote">
                      Drink water regularly through your waking day.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ProgressView
                data={data}
                profile={profile}
                day={day}
                editable={editable}
                own={own && !preview}
              />
            )}
            {(view === "overview" ||
              view === "exercise" ||
              view === "meals") && (
              <section className="panel reference">
                <details>
                  <summary>Plan reference · complete source notes</summary>
                  <p className="footnote" style={{ marginBottom: 15 }}>
                    {program.source}. Daily targets above are the actionable
                    checklist. The original extracted pages below preserve all
                    training, nutrition, safety and progression notes.
                  </p>
                  {plan.notes
                    .filter((n) => n.person === person)
                    .map((n) => (
                      <details key={n.id}>
                        <summary>{n.title}</summary>
                        <pre>{n.body}</pre>
                      </details>
                    ))}
                </details>
              </section>
            )}
            <p className="footnote">
              Together / Thirty · Dates follow {zone}. Workout and progress
              notes are visible to both of you.
            </p>
          </main>
        </div>
      </div>
    </>
  );
}
function Meter({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  return (
    <div>
      <div className="stat-line">
        <span>{label}</span>
        <strong>
          {done} / {total}
        </strong>
      </div>
      <div
        className="meter"
        role="progressbar"
        aria-label={label}
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total || 1}
      >
        <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat-card">
      <span className="label">
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
function Partner({
  profile,
  data,
  href,
}: {
  profile: Profile;
  data: DashboardData;
  href: string;
}) {
  const status = programStatus(
    profile.start_date,
    data.trainingToday[profile.id],
  );
  const summary = daySummary(
    data.plan,
    data.progress,
    profile,
    status.day,
    data.trainingToday[profile.id],
  );
  const total = overall(
    data.plan,
    data.progress,
    profile,
    data.trainingToday[profile.id],
  );
  return (
    <section className="partner-card">
      <span className="eyebrow muted" style={{ marginBottom: 15 }}>
        In this together
      </span>
      <div className="partner-head">
        <span className={`avatar ${profile.id}`}>{names[profile.id][0]}</span>
        <div>
          <h3>{names[profile.id]}</h3>
          <p>
            {profile.start_date
              ? `Day ${status.day} · ${total.streak}-day streak`
              : "Getting ready to begin"}
          </p>
        </div>
        <Link href={href} aria-label={`View ${names[profile.id]}’s progress`}>
          <ArrowUpRight size={21} />
        </Link>
      </div>
      <div className="stat-line">
        <span>Today’s session</span>
        <span>
          {summary.workoutDone
            ? "Completed"
            : summary.taskDone
              ? "In progress"
              : "Not started"}
        </span>
      </div>
      <div className="stat-line">
        <span>Meals</span>
        <span>
          {summary.mealDone} / {summary.meals}
        </span>
      </div>
      <Meter label="30-day progress" done={total.completed} total={30} />
      <p className="notice">
        Small steps count. Keep showing up for yourselves.
      </p>
    </section>
  );
}
function ProgressView({
  data,
  profile,
  day,
  editable,
  own,
}: {
  data: DashboardData;
  profile: Profile;
  day: number;
  editable: boolean;
  own: boolean;
}) {
  const { plan, progress } = data;
  const person = profile.id;
  const today = data.trainingToday[person];
  const total = overall(plan, progress, profile, today);
  const week = Math.min(4, Math.ceil(day / 7));
  const metricDefs = plan.metrics.filter((m) => m.person === person);
  const loggedSteps = progress.measurements.filter(
    (m) =>
      m.person === person &&
      m.metric === "steps" &&
      Math.ceil(m.day / 7) === week,
  );
  const activity = [
    ...progress.taskProgress
      .filter((p) => p.person === person)
      .map((p) => ({
        title: `${p.completed ? "Completed" : "Updated"} a session task`,
        day: p.day,
        time: p.updated_at,
      })),
    ...progress.mealProgress
      .filter((p) => p.person === person)
      .map((p) => ({
        title: `${p.completed ? "Completed" : "Updated"} a meal`,
        day: p.day,
        time: p.updated_at,
      })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);
  return (
    <>
      <div className="progress-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Consistency, week by week</h2>
            <ChartNoAxesColumn size={19} />
          </div>
          <div className="week-bars">
            {[1, 2, 3, 4, 5].map((w) => {
              const count = total.rows
                .slice((w - 1) * 7, Math.min(w * 7, 30))
                .filter((r) => r.complete).length;
              return (
                <div key={w}>
                  <div className="week-bar-label">
                    <span>{w === 5 ? "Final two days" : `Week ${w}`}</span>
                    <span>
                      {count} / {w === 5 ? 2 : 7} days
                    </span>
                  </div>
                  <div className="meter">
                    <span
                      style={{ width: `${(count / (w === 5 ? 2 : 7)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="footnote">
            A completed day includes scheduled session tasks and required meals.
            Recovery and full-rest days count; optional items don’t.
          </p>
          <p className="footnote">
            {person === "dhruv" ? `${total.runs} runs logged · ` : ""}
            {total.recovery} recovery / rest days followed.
          </p>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Day {day} measurements</h2>
          </div>
          {editable ? (
            <MeasurementForm person={person} day={day} metrics={metricDefs} />
          ) : (
            <p className="empty">
              {own
                ? "Measurements can be logged once this day begins."
                : "Only the profile owner can add measurements."}
            </p>
          )}
          <p className="footnote">
            {person === "dhruv"
              ? "Waist: Days 1, 8, 15, 22 and 30 under similar conditions. Morning body weight: several times per week; focus on the trend."
              : "Record daily steps here. Day 29 includes benchmarks; body weight is optional."}
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>Your recorded progress</h2>
        </div>
        <div className="metric-history">
          {metricDefs.map((metric) => {
            const rows = progress.measurements.filter(
              (m) => m.person === person && m.metric === metric.key,
            );
            const last = rows.at(-1);
            const points = rows.map((r) => ({
              day: r.day,
              value: Number(r.value),
            }));
            const min = Math.min(...points.map((p) => p.value)),
              max = Math.max(...points.map((p) => p.value));
            return (
              <div className="metric-tile" key={metric.key}>
                <h3>{metric.label}</h3>
                {last ? (
                  <>
                    <strong>
                      {last.value} <small>{metric.unit}</small>
                    </strong>
                    <small>Latest · Day {last.day}</small>
                    {points.length > 1 && (
                      <svg
                        className="chart"
                        viewBox="0 0 300 110"
                        role="img"
                        aria-label={`${metric.label} across recorded days; values listed below`}
                      >
                        <path d="M10 90H290" stroke="#e0e6ed" fill="none" />
                        <polyline
                          points={points
                            .map(
                              (p) =>
                                `${10 + ((p.day - 1) / 29) * 280},${85 - ((p.value - min) / (max - min || 1)) * 65}`,
                            )
                            .join(" ")}
                          stroke="var(--accent)"
                          fill="none"
                          strokeWidth="2"
                        />
                        {points.map((p) => (
                          <circle
                            key={p.day}
                            cx={10 + ((p.day - 1) / 29) * 280}
                            cy={85 - ((p.value - min) / (max - min || 1)) * 65}
                            r="3"
                            fill="var(--accent)"
                          />
                        ))}
                      </svg>
                    )}
                    <details>
                      <summary>All entries</summary>
                      {rows.map((r) => (
                        <div className="history-row" key={r.day}>
                          <span>Day {r.day}</span>
                          <span>
                            {r.value} {metric.unit}
                          </span>
                        </div>
                      ))}
                    </details>
                  </>
                ) : (
                  <p className="empty">
                    No measurements yet. Your first entry starts the story.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {person === "annanya" && (
        <section className="panel">
          <div className="panel-title">
            <h2>Week {week} check-in</h2>
          </div>
          <p className="notice" style={{ marginBottom: 18 }}>
            {
              plan.days.filter(
                (d) =>
                  d.person === person &&
                  d.week === week &&
                  d.kind === "strength" &&
                  total.rows[d.day - 1].workoutDone,
              ).length
            }{" "}
            / 4 workouts completed ·{" "}
            {loggedSteps.length
              ? `${Math.round(loggedSteps.reduce((s, m) => s + Number(m.value), 0) / loggedSteps.length).toLocaleString()} average steps across ${loggedSteps.length} logged days`
              : "No steps recorded this week"}
          </p>
          <CheckinForm
            key={week}
            week={week}
            checkin={progress.checkins.find(
              (c) => c.person === person && c.week === week,
            )}
            editable={
              own && canEditDay(profile.start_date, (week - 1) * 7 + 1, today)
            }
          />
        </section>
      )}
      <section className="panel">
        <div className="panel-title">
          <h2>Recent activity</h2>
          <ChevronRight size={17} />
        </div>
        <div className="activity">
          {activity.length ? (
            activity.map((a, i) => (
              <p key={i}>
                {a.title}
                <small>
                  Day {a.day} ·{" "}
                  {new Intl.DateTimeFormat("en-IN", {
                    timeZone: data.zone,
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(a.time))}
                </small>
              </p>
            ))
          ) : (
            <p className="empty">
              No activity recorded yet. Your completed sessions and meals will
              appear here.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function KitchenGuide({ notes }: { notes: Note[] }) {
  return (
    <section className="panel kitchen-guide" id="kitchen-guide">
      <span className="eyebrow">From your updated plan · page 8</span>
      <h2>Meal Prep Guide</h2>
      <p className="muted">A little preparation for the nights ahead.</p>
      {notes.map((note) => (
        <details key={note.id}>
          <summary>{note.title}</summary>
          <p>{note.body}</p>
        </details>
      ))}
    </section>
  );
}

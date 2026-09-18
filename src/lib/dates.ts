const DAY_MS = 86400000;
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function dateInZone(
  now = new Date(),
  timeZone = "Asia/Kolkata",
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function addDays(date: string, n: number) {
  if (!validDate(date)) throw new Error("Invalid date");
  return new Date(Date.parse(date + "T12:00:00Z") + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}
export function programStatus(start: string | null, today: string) {
  if (!start) return { state: "not_started" as const, day: 1, elapsed: 0 };
  const elapsed =
    Math.floor(
      (Date.parse(today + "T12:00:00Z") - Date.parse(start + "T12:00:00Z")) /
        DAY_MS,
    ) + 1;
  return {
    state:
      elapsed < 1
        ? ("not_started" as const)
        : elapsed > 30
          ? ("completed" as const)
          : ("active" as const),
    day: Math.min(30, Math.max(1, elapsed)),
    elapsed,
  };
}
export function rotationDay(
  person: "dhruv" | "annanya",
  day: number,
  start: string | null,
) {
  if (person === "annanya") return ((day - 1) % 7) + 1;
  if (!start) return null;
  return new Date(addDays(start, day - 1) + "T12:00:00Z").getUTCDay() || 7;
}
export function canEditDay(start: string | null, day: number, today: string) {
  return !!start && day >= 1 && day <= 30 && addDays(start, day - 1) <= today;
}
export function displayDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}

/** Evening-anchored date for an overnight session, in the configured local zone.
 * 05:00 is the end of Dhruv's wind-down/sleep onset in the updated PDF.
 * Compare the local clock (not a UTC duration) so DST zones remain correct.
 */
export function trainingDate(
  person: "dhruv" | "annanya",
  now = new Date(),
  timeZone = "Asia/Kolkata",
) {
  const date = dateInZone(now, timeZone);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return person === "dhruv" && hour < 5 ? addDays(date, -1) : date;
}

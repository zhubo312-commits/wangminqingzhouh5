export function dateInTimeZone(
  date = new Date(),
  timeZone = "Asia/Shanghai",
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year!, month! - 1, day! + days, 12));
  return value.toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

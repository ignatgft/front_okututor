const pad = (n: number): string => String(n).padStart(2, "0");

export function toLocalInput(date: Date | null | undefined): string {
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localDateToStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildCalendarDay(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parts = String(value).split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function parseStartAt(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function compareByCalendarDay(startAt: string | null | undefined, date: Date): boolean {
  const start = parseStartAt(startAt);
  return start ? isSameDay(start, date) : false;
}

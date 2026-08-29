const pad = (n) => String(n).padStart(2, "0");

export function toLocalInput(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localDateToStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildCalendarDay(value) {
  if (!value) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function parseStartAt(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function compareByCalendarDay(startAt, date) {
  const start = parseStartAt(startAt);
  return start ? isSameDay(start, date) : false;
}

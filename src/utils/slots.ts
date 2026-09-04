import type { AvailabilitySlot } from "../types/api";

export const DAY_NAMES: readonly string[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function weekdayOf(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return DAY_NAMES[d.getDay()];
}

const pad = (n: number): string => String(n).padStart(2, "0");

function parseTime(raw: string | null | undefined): [number, number] {
  const parts = String(raw ?? "09:00").split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return [Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m];
}

export interface GenerateSlotOptions {
  step?: number;
  max?: number;
}

export function generateSlotTimes(
  availability: AvailabilitySlot[] = [],
  date: Date | null,
  opts: GenerateSlotOptions = {}
): string[] {
  const step = Number(opts.step) || 15;
  const max = Number(opts.max) || 200;
  if (!date) return [];

  const weekday = weekdayOf(date);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const base: string[] = [];
  const matching = (availability || []).filter(
    (s) => String((s as Record<string, unknown>)["weekday"] ?? "").toLowerCase() === weekday
  );
  if (matching.length > 0) {
    matching.forEach((s) => {
      const [sh, sm] = parseTime(s.start_time);
      const [eh, em] = parseTime(s.end_time);
      let h = sh;
      let m = sm;
      while (h * 60 + m < eh * 60 + em && base.length < max) {
        base.push(`${pad(h)}:${pad(m)}`);
        m += step;
        if (m >= 60) {
          m = 0;
          h += 1;
        }
      }
    });
  } else {
    for (let h = 0; h < 24 && base.length < max; h++) {
      for (let m = 0; m < 60 && base.length < max; m += step) {
        base.push(`${pad(h)}:${pad(m)}`);
      }
    }
  }

  if (!isToday) return base;
  const now = new Date();
  return base.filter((tm) => {
    const [hh, mm] = tm.split(":").map(Number);
    const candidate = new Date(today);
    candidate.setHours(hh, mm, 0, 0);
    return candidate.getTime() > now.getTime();
  });
}

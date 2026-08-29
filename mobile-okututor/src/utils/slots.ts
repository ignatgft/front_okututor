export interface AvailabilitySlot {
  id?: string | number;
  weekday?: string;
  start_time?: string;
  end_time?: string;
}

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

/**
 * Split "HH:MM" into [hours, minutes]; returns [0,0] on bad input.
 */
function parseTime(raw: string | undefined): [number, number] {
  const parts = String(raw || "09:00").split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return [Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m];
}

/**
 * Build up to `max` candidate start times (HH:MM strings) for a given day.
 * Uses the tutor availability slots matching that weekday first; if none
 * exist it falls back to a whole-day grid so the picker is never empty.
 * Times earlier than `now` (when date is today) are skipped.
 */
export function generateSlotTimes(
  availability: AvailabilitySlot[] | null | undefined,
  date: Date | null | undefined,
  opts: { step?: number; max?: number } = {}
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
    (s) => String(s.weekday || "").toLowerCase() === weekday
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
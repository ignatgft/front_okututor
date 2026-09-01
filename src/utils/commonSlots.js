const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function normalizeSlot(slot = {}) {
  return {
    weekday: String(slot.weekday || "").toLowerCase(),
    start: slot.start_time || slot.start || "00:00",
    end: slot.end_time || slot.end || "23:59",
  };
}

function toMin(t) {
  const [h = 0, m = 0] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
}

const pad = (n) => String(n).padStart(2, "0");
const fmt = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

/**
 * Compute the intersection of the tutor's weekly availability with either the
 * student's preferred day/time window (from the application) or the student's
 * own availability slots.
 *
 * Returns an array of { weekday, start, end } describing overlapping windows
 * (client-side fallback for the not-yet-existing GET /schedule/common-slots).
 */
export function computeCommonSlots(tutorAvailability = [], studentInput = {}) {
  const studentPref = normalizeStudent(studentInput);
  const slots = (tutorAvailability || []).map(normalizeSlot);
  const results = [];

  for (const s of slots) {
    const sStart = toMin(s.start);
    const sEnd = toMin(s.end);

    for (const day of studentPref.days) {
      if (day !== s.weekday) continue;
      for (const window of studentPref.windows) {
        const wStart = toMin(window.start);
        const wEnd = toMin(window.end);
        const start = Math.max(sStart, wStart);
        const end = Math.min(sEnd, wEnd);
        if (end > start) {
          results.push({ weekday: day, start: fmt(start), end: fmt(end) });
        }
      }
    }
  }

  results.sort((a, b) => {
    const d = DAYS.indexOf(a.weekday) - DAYS.indexOf(b.weekday);
    return d !== 0 ? d : toMin(a.start) - toMin(b.start);
  });

  return dedupe(results);
}

function normalizeStudent(input = {}) {
  if (Array.isArray(input) && input.length > 0 && input[0].weekday) {
    const windows = input.map((s) => ({ weekday: s.weekday, start: s.start_time || "00:00", end: s.end_time || "23:59" }));
    return { days: windows.map((w) => w.weekday), windows };
  }
  const days = Array.isArray(input.days) ? input.days : [];
  const start = input.startTime || input.start_time || "00:00";
  const end = input.endTime || input.end_time || "23:59";
  return { days, windows: [{ start, end }] };
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = `${item.weekday}|${item.start}|${item.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

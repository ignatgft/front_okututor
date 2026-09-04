import type { AvailabilitySlot } from "../types/api";

const DAYS: readonly string[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

interface NormalizedSlot {
  weekday: string;
  start: string;
  end: string;
}

function normalizeSlot(slot: unknown = {}): NormalizedSlot {
  const rec = (slot as Record<string, unknown>) ?? {};
  return {
    weekday: String(rec["weekday"] ?? "").toLowerCase(),
    start: (rec["start_time"] as string) ?? (rec["start"] as string) ?? "00:00",
    end: (rec["end_time"] as string) ?? (rec["end"] as string) ?? "23:59",
  };
}

function toMin(t: string): number {
  const [h = 0, m = 0] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
}

const pad = (n: number): string => String(n).padStart(2, "0");
const fmt = (min: number): string => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

interface StudentWindow {
  start: string;
  end: string;
}

interface StudentPref {
  days: string[];
  windows: StudentWindow[];
}

export function computeCommonSlots(
  tutorAvailability: AvailabilitySlot[] = [],
  studentInput: unknown = {}
): NormalizedSlot[] {
  const studentPref = normalizeStudent(studentInput);
  const slots = (tutorAvailability || []).map(normalizeSlot);
  const results: NormalizedSlot[] = [];

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

function normalizeStudent(input: unknown = {}): StudentPref {
  if (Array.isArray(input) && input.length > 0 && (input[0] as Record<string, unknown>)?.["weekday"]) {
    const windows = (input as Record<string, unknown>[]).map((s) => ({
      weekday: String(s["weekday"] ?? "").toLowerCase(),
      start: (s["start_time"] as string) ?? "00:00",
      end: (s["end_time"] as string) ?? "23:59",
    }));
    return { days: windows.map((w) => w.weekday), windows };
  }
  const rec = (input as Record<string, unknown>) ?? {};
  const days = Array.isArray(rec["days"]) ? (rec["days"] as string[]) : [];
  const start = (rec["startTime"] as string) ?? (rec["start_time"] as string) ?? "00:00";
  const end = (rec["endTime"] as string) ?? (rec["end_time"] as string) ?? "23:59";
  return { days, windows: [{ start, end }] };
}

function dedupe(list: NormalizedSlot[]): NormalizedSlot[] {
  const seen = new Set<string>();
  const out: NormalizedSlot[] = [];
  for (const item of list) {
    const key = `${item.weekday}|${item.start}|${item.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

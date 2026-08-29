import { describe, it, expect } from "vitest";
import {
  toLocalInput,
  buildCalendarDay,
  isSameDay,
  isToday,
  parseStartAt,
  compareByCalendarDay,
} from "./date";

describe("toLocalInput", () => {
  it("formats a date as yyyy-MM-dd in local time", () => {
    expect(toLocalInput(new Date(2026, 7, 27))).toBe("2026-08-27");
    expect(toLocalInput(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("returns empty string for invalid input", () => {
    expect(toLocalInput(null)).toBe("");
  });
});

describe("buildCalendarDay / isSameDay", () => {
  it("builds a local calendar day from yyyy-MM-dd", () => {
    const d = buildCalendarDay("2026-08-27");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(27);
  });

  it("isSameDay compares calendar days regardless of time of day", () => {
    expect(isSameDay(new Date(2026, 7, 27, 23, 59), new Date(2026, 7, 27, 0, 0))).toBe(true);
    expect(isSameDay(new Date(2026, 7, 27), new Date(2026, 7, 28))).toBe(false);
  });

  it("isToday matches against the current date", () => {
    expect(isToday(new Date())).toBe(true);
  });
});

describe("parseStartAt / compareByCalendarDay", () => {
  it("parses ISO start_at and compares calendar day in local tz", () => {
    const iso = new Date(2026, 7, 27, 10, 0, 0).toISOString();
    expect(parseStartAt(iso).getTime()).toBe(new Date(2026, 7, 27, 10, 0, 0).getTime());
    expect(compareByCalendarDay(iso, new Date(2026, 7, 27))).toBe(true);
    expect(compareByCalendarDay(iso, new Date(2026, 7, 28))).toBe(false);
  });

  it("handles missing/bad values", () => {
    expect(parseStartAt(null)).toBe(null);
    expect(compareByCalendarDay("not-a-date", new Date())).toBe(false);
  });
});

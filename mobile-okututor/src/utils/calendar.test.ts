import { describe, it, expect } from "vitest";
import { addDays, addMonths, formatDurationMin, monthGridFor, monthKey, startOfWeek, weekDaysFor } from "./calendar";

describe("calendar utils", () => {
  it("startOfWeek returns the previous Monday (same-week Monday otherwise)", () => {
    // 2026-08-31 is a Monday
    expect(startOfWeek(new Date(2026, 7, 31)).getDay()).toBe(1);
    // 2026-09-03 is a Thursday -> Monday 2026-08-31
    expect(startOfWeek(new Date(2026, 8, 3)).toDateString()).toBe(new Date(2026, 7, 31).toDateString());
    // a Sunday (2026-09-06) -> the Monday before (2026-08-31)
    expect(startOfWeek(new Date(2026, 8, 6)).toDateString()).toBe(new Date(2026, 7, 31).toDateString());
  });

  it("weekDaysFor returns 7 consecutive days starting on Monday", () => {
    const days = weekDaysFor(new Date(2026, 8, 3));
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
  });

  it("monthGridFor pads leading offsets and covers every day of the month", () => {
    const grid = monthGridFor(new Date(2026, 8, 1)); // September 2026 starts on Tuesday
    const dates = grid.filter((d): d is Date => d !== null);
    expect(grid.slice(0, 1)).toEqual([null]);
    expect(dates).toHaveLength(30);
    expect(dates[dates.length - 1].getDate()).toBe(30);
  });

  it("addDays handles month boundaries", () => {
    expect(addDays(new Date(2026, 7, 31), 1).toDateString()).toBe(new Date(2026, 8, 1).toDateString());
  });

  it("addMonths normalizes to the 1st of the target month", () => {
    expect(addMonths(new Date(2026, 8, 15), 1).toDateString()).toBe(new Date(2026, 9, 1).toDateString());
  });

  it("monthKey is zero-padded", () => {
    expect(monthKey(new Date(2026, 8, 5))).toBe("2026-09");
    expect(monthKey(new Date(2026, 10, 5))).toBe("2026-11");
  });

  it("formatDurationMin rounds to whole minutes and never returns negatives", () => {
    expect(formatDurationMin("2026-09-01T10:00:00Z", "2026-09-01T10:45:00Z")).toBe(45);
    expect(formatDurationMin("2026-09-01T11:00:00Z", "2026-09-01T10:00:00Z")).toBe(0);
  });
});
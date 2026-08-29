import { describe, it, expect } from "vitest";
import {
  startOfWeek,
  weekDaysFor,
  monthGridFor,
  addDays,
  addMonths,
  monthKey,
  eventDaysKey,
  formatDurationMin,
} from "./calendar";

describe("calendar utils", () => {
  it("startOfWeek yields Monday", () => {
    expect(startOfWeek(new Date(2026, 7, 27)).getDay()).toBe(1);
  });

  it("weekDaysFor returns 7 consecutive days starting Monday", () => {
    const days = weekDaysFor(new Date(2026, 7, 27));
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(24);
    expect(days[6].getDate()).toBe(30);
  });

  it("monthGridFor pads prefix with nulls and total aligns to grid", () => {
    const grid = monthGridFor(new Date(2026, 7, 1));
    expect(grid.filter(Boolean)).toHaveLength(31);
    expect(grid[0]).toBeNull();
  });

  it("addDays and addMonths shift correctly", () => {
    expect(addDays(new Date(2026, 7, 31), 1).getDate()).toBe(1);
    expect(addDays(new Date(2026, 7, 31), 1).getMonth()).toBe(8);
    expect(addMonths(new Date(2026, 0, 10), 1).getMonth()).toBe(1);
  });

  it("monthKey and eventDaysKey format correctly", () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01");
    expect(eventDaysKey(new Date(2026, 10, 4))).toBe("2026-11-04");
  });

  it("formatDurationMin computes minutes between start/end", () => {
    expect(formatDurationMin("2026-08-27T18:00:00", "2026-08-27T18:45:00")).toBe(45);
  });
});

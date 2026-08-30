import { describe, it, expect } from "vitest";
import { generateSlotTimes, weekdayOf } from "./slots";

describe("weekdayOf", () => {
  it("maps a date to a lowercase weekday name", () => {
    // 2026-08-31 is a Monday
    expect(weekdayOf(new Date(2026, 7, 31))).toBe("monday");
    expect(weekdayOf("2026-08-31")).toBe("monday");
    expect(weekdayOf(null)).toBe("");
    expect(weekdayOf("not-a-date")).toBe("");
  });
});

// A Monday strictly in the future, so `generateSlotTimes` never treats it as
// "today" (which would filter out past slots and make the assertions flaky).
function futureMonday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const daysToMonday = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysToMonday);
  return d;
}

describe("generateSlotTimes", () => {
  it("returns [] for a missing date", () => {
    expect(generateSlotTimes([], null)).toEqual([]);
  });

  it("falls back to a whole-day 15-min grid when no availability matches", () => {
    const date = futureMonday(); // a Monday with no matching slots
    const times = generateSlotTimes([{ weekday: "sunday", start_time: "10:00", end_time: "12:00" }], date);
    expect(times.length).toBe(96);
    expect(times[0]).toBe("00:00");
    expect(times.at(-1)).toBe("23:45");
  });

  it("generates times only within the matching weekday window", () => {
    const date = futureMonday();
    const times = generateSlotTimes(
      [{ weekday: "monday", start_time: "10:00", end_time: "12:00" }],
      date,
      { step: 30 }
    );
    expect(times).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });

  it("respects the max slot cap", () => {
    const date = new Date(2026, 7, 30); // Sunday, no matching -> grid
    const times = generateSlotTimes([{ weekday: "monday" }], date, { max: 5 });
    expect(times.length).toBe(5);
  });
});

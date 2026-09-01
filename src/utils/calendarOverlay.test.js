import { describe, it, expect } from "vitest";
import { buildCalendarGrid } from "../components/calendar/CalendarWeekOverlay";

const availability = [
  { weekday: "monday", start_time: "09:00", end_time: "11:00", available: true },
  { weekday: "monday", start_time: "13:00", end_time: "14:00", available: false },
  { weekday: 3, start_time: "10:00", end_time: "12:00", available: true },
];

describe("buildCalendarGrid", () => {
  it("exposes 7 days in Mon-Sun order", () => {
    const grid = buildCalendarGrid([]);
    expect(grid.days).toEqual(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
  });

  it("generates hours from the default range", () => {
    const grid = buildCalendarGrid([]);
    expect(grid.minutes).toEqual([420, 480, 540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080, 1140, 1200]);
  });

  it("marks cells inside an available window", () => {
    const grid = buildCalendarGrid(availability);
    expect(grid.cellAt("monday", 540)).toBe("available");
    expect(grid.cellAt("monday", 660)).toBe("none");
  });

  it("marks busy cells red", () => {
    const grid = buildCalendarGrid(availability);
    expect(grid.cellAt("monday", 780)).toBe("busy");
  });

  it("resolves numeric weekday (1=Monday)", () => {
    const grid = buildCalendarGrid(availability);
    expect(grid.cellAt("wednesday", 600)).toBe("available");
  });
});

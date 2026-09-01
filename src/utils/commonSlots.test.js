import { describe, it, expect } from "vitest";
import { computeCommonSlots } from "./commonSlots";

describe("computeCommonSlots", () => {
  const tutorSlots = [
    { weekday: "monday", start_time: "09:00", end_time: "17:00" },
    { weekday: "wednesday", start_time: "18:00", end_time: "20:00" },
  ];

  it("returns the overlap between tutor availability and student day window", () => {
    const result = computeCommonSlots(tutorSlots, {
      days: ["monday"],
      startTime: "10:00",
      endTime: "12:00",
    });
    expect(result).toEqual([{ weekday: "monday", start: "10:00", end: "12:00" }]);
  });

  it("returns [] when student days do not overlap tutor availability", () => {
    const result = computeCommonSlots(tutorSlots, {
      days: ["friday"],
      startTime: "09:00",
      endTime: "10:00",
    });
    expect(result).toEqual([]);
  });

  it("clamps the overlap to the tutor's window", () => {
    const result = computeCommonSlots(tutorSlots, {
      days: ["wednesday"],
      startTime: "17:00",
      endTime: "23:00",
    });
    expect(result).toEqual([{ weekday: "wednesday", start: "18:00", end: "20:00" }]);
  });

  it("handles a student availability slot list input", () => {
    const result = computeCommonSlots(tutorSlots, [
      { weekday: "monday", start_time: "09:00", end_time: "17:00" },
    ]);
    expect(result).toEqual([{ weekday: "monday", start: "09:00", end: "17:00" }]);
  });

  it("dedupes identical overlapping slots", () => {
    const result = computeCommonSlots(
      [
        { weekday: "monday", start_time: "09:00", end_time: "17:00" },
        { weekday: "monday", start_time: "09:00", end_time: "17:00" },
      ],
      { days: ["monday"], startTime: "09:00", endTime: "12:00" }
    );
    expect(result).toEqual([{ weekday: "monday", start: "09:00", end: "12:00" }]);
  });
});

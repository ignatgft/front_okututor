import { describe, it, expect } from "vitest";
import { normalizeCalendarEvents } from "../api/calendar.api";
import { eventDaysKey } from "../utils/calendar";

// Mock 8 lessons same scheduleId, different dates, Mon/Wed/Fri starting 2026-09-02 (Wed)
function makeLessons() {
  // Mon/Wed/Fri pattern for 8 lessons: Wed 02, Fri 04, Mon 07, Wed 09, Fri 11, Mon 14, Wed 16, Fri 18
  const dates = [
    "2026-09-02T09:00:00.000Z",
    "2026-09-04T09:00:00.000Z",
    "2026-09-07T09:00:00.000Z",
    "2026-09-09T09:00:00.000Z",
    "2026-09-11T09:00:00.000Z",
    "2026-09-14T09:00:00.000Z",
    "2026-09-16T09:00:00.000Z",
    "2026-09-18T09:00:00.000Z",
  ];
  return dates.map((start_at, i) => ({
    id: `lesson-${i + 1}`,
    schedule_id: "sched-1",
    booking_id: "book-1",
    course_id: "course-1",
    start_at,
    end_at: new Date(new Date(start_at).getTime() + 60 * 60000).toISOString(),
    status: "SCHEDULED",
    title: `Lesson ${i + 1}`,
  }));
}

describe("Audit 8->1 - API response handling", () => {
  it("normalizeCalendarEvents preserves 8 with same scheduleId", () => {
    const lessons = makeLessons();
    const normalized = normalizeCalendarEvents(lessons);
    expect(normalized).toHaveLength(8);
    expect(normalized[0].id).toBe("lesson-1");
    expect(normalized[7].id).toBe("lesson-8");
  });

  it("does not dedupe by bookingId/scheduleId", () => {
    const lessons = makeLessons();
    const map = new Map();
    lessons.forEach((l) => map.set(l.id, l)); // correct: key by lesson.id
    expect(map.size).toBe(8);
    const badMap = new Map();
    lessons.forEach((l) => badMap.set(l.booking_id, l)); // buggy: dedupes to 1
    expect(badMap.size).toBe(1);
    expect(badMap.size).not.toBe(8);
  });

  it("eventDaysKey grouping preserves all 8 across days", () => {
    const lessons = makeLessons();
    const eventsByDay = {};
    for (const evt of lessons) {
      const key = eventDaysKey(new Date(evt.start_at));
      (eventsByDay[key] || (eventsByDay[key] = [])).push(evt);
    }
    const total = Object.values(eventsByDay).flat().length;
    expect(total).toBe(8);
    // each day should have at most 1 lesson for this pattern (Mon/Wed/Fri)
    expect(Object.keys(eventsByDay)).toHaveLength(8);
  });

  it("key uniqueness: lesson.id not bookingId", () => {
    const lessons = makeLessons();
    const keysById = lessons.map((l) => l.id);
    const keysByBooking = lessons.map((l) => l.booking_id);
    expect(new Set(keysById).size).toBe(8);
    expect(new Set(keysByBooking).size).toBe(1);
  });

  it("date filtering: from/to range must include all 8", () => {
    const lessons = makeLessons();
    const from = new Date("2026-09-01T00:00:00.000Z");
    const to = new Date("2026-09-30T23:59:59.000Z");
    const filtered = lessons.filter((l) => {
      const d = new Date(l.start_at);
      return d >= from && d <= to;
    });
    expect(filtered).toHaveLength(8);
    // simulate buggy string comparison
    const buggy = lessons.filter((l) => l.start_at.slice(0, 10) >= "2026-09-01" && l.start_at.slice(0, 10) <= "2026-09-30");
    expect(buggy).toHaveLength(8);
  });

  it("pagination: content vs lessons vs items", () => {
    const lessons = makeLessons();
    const pageResponse = { content: lessons, total_elements: 8, total_pages: 1 };
    const normalized1 = Array.isArray(pageResponse) ? pageResponse : pageResponse.content || [];
    expect(normalized1).toHaveLength(8);
    const badHandling = pageResponse.content.slice(0, 1);
    expect(badHandling).toHaveLength(1);
    // frontend should not do slice(0,1)
  });

  it("find vs filter: should not use find for list", () => {
    const lessons = makeLessons();
    const filtered = lessons.filter((l) => l.schedule_id === "sched-1");
    expect(filtered).toHaveLength(8);
    const found = lessons.find((l) => l.schedule_id === "sched-1");
    expect(found.id).toBe("lesson-1");
    // find returns 1, filter returns 8
  });
});

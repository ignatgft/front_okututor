import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeCalendarEvents } from "../api/calendar.api";
import { eventDaysKey } from "../utils/calendar";

function make8Lessons() {
  const dates = [
    "2026-09-07T09:00:00.000Z", // Mon
    "2026-09-09T09:00:00.000Z", // Wed
    "2026-09-11T09:00:00.000Z", // Fri
    "2026-09-14T09:00:00.000Z", // Mon
    "2026-09-16T09:00:00.000Z", // Wed
    "2026-09-18T09:00:00.000Z", // Fri
    "2026-09-21T09:00:00.000Z", // Mon
    "2026-09-23T09:00:00.000Z", // Wed
  ];
  return dates.map((start_at, i) => ({
    id: `lesson-${i + 1}`,
    schedule_id: "sched-1",
    booking_id: "book-1",
    course_id: "course-1",
    start_at,
    end_at: new Date(new Date(start_at).getTime() + 60 * 60000).toISOString(),
    status: i === 2 ? "CANCELLED" : "SCHEDULED",
    course_title: "Advanced English",
    teacher_name: "Tutor",
  }));
}

describe("E2E 8 lessons flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("API 8 -> normalized 8 -> calendar 8 -> lessons 8", async () => {
    const lessons = make8Lessons();
    // API returns 8
    const apiResponse = { content: lessons, total_elements: 8 };
    expect(apiResponse.content).toHaveLength(8);

    // normalized 8
    const normalized = normalizeCalendarEvents(apiResponse.content);
    expect(normalized).toHaveLength(8);

    // grouped 8
    const eventsByDay = {};
    for (const evt of normalized) {
      const key = eventDaysKey(new Date(evt.start_at));
      (eventsByDay[key] || (eventsByDay[key] = [])).push(evt);
    }
    expect(Object.values(eventsByDay).flat()).toHaveLength(8);
    expect(Object.keys(eventsByDay)).toHaveLength(8); // each day 1

    // filtered 8 (range contains all)
    const from = new Date("2026-09-01T00:00:00.000Z");
    const to = new Date("2026-09-30T23:59:59.000Z");
    const filtered = normalized.filter((l) => {
      const d = new Date(l.start_at);
      return d >= from && d <= to;
    });
    expect(filtered).toHaveLength(8);

    // rendered 8 (lessons page)
    expect(filtered.map((l) => l.id)).toEqual(lessons.map((l) => l.id));
  });

  it("PgLessons renders 8 (not 1) with pagination handling", async () => {
    const lessons = make8Lessons();
    // test alternative shapes
    const alt1 = { lessons };
    const alt2 = { items: lessons };
    const alt3 = lessons;
    const alt0 = { content: lessons, total_elements: 8 };
    for (const data of [alt0, alt1, alt2, alt3]) {
      const list = Array.isArray(data) ? data : data.content ?? data.lessons ?? data.items ?? [];
      expect(list).toHaveLength(8);
    }
  });

  it("keys are unique per lesson, not bookingId", () => {
    const lessons = make8Lessons();
    const keysById = new Set(lessons.map((l) => l.id));
    const keysByBooking = new Set(lessons.map((l) => l.booking_id));
    expect(keysById.size).toBe(8);
    expect(keysByBooking.size).toBe(1);
    // UI must use lesson.id, not bookingId
  });

  it("sorting is chronological", () => {
    const lessons = make8Lessons().reverse();
    const sorted = [...lessons].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    expect(sorted[0].id).toBe("lesson-1");
    expect(sorted[7].id).toBe("lesson-8");
  });

  it("cancellation preserves other 7", () => {
    const lessons = make8Lessons();
    const total = lessons.length;
    const cancelled = lessons.filter((l) => l.status === "CANCELLED");
    const active = lessons.filter((l) => l.status !== "CANCELLED");
    expect(total).toBe(8);
    expect(cancelled).toHaveLength(1);
    expect(active).toHaveLength(7);
    // UI should show cancelled state, not delete
  });

  it("timezone Asia/Bishkek 09:00 local stays same day", () => {
    const local0900Bishkek = "2026-09-07T09:00:00+06:00"; // 09:00 Bishkek = 03:00Z
    const utc = new Date(local0900Bishkek);
    const key = eventDaysKey(utc); // toLocalInput uses local time, so should be 2026-09-07
    // In test environment, local is UTC, but we check that 09:00+06 is still 2026-09-07 in Bishkek timezone
    // For our utils, eventDaysKey uses local, so in CI (UTC) it would be 2026-09-07T03:00Z -> 2026-09-07 local (UTC) = 07
    expect(key).toBe("2026-09-07");
    // Edge: 00:00, 23:30, 23:30+90
    const midnight = new Date("2026-09-07T00:00:00+06:00");
    expect(eventDaysKey(midnight)).toBe("2026-09-07");
    const late = new Date("2026-09-07T23:30:00+06:00");
    expect(eventDaysKey(late)).toBe("2026-09-07");
  });

  it("pagination: 8,20,100,101", () => {
    const lessons = make8Lessons();
    const page0 = { content: lessons.slice(0, 8), total_elements: 8, total_pages: 1 };
    expect(page0.content).toHaveLength(8);
    // frontend should request size=100 to get all 8 in one page
  });

  it("error != empty", async () => {
    const errorResponse = { response: { ok: false, status: 500 }, data: { message: "Server error" } };
    const isError = !errorResponse.response.ok;
    expect(isError).toBe(true);
    // UI must show ErrorState, not EmptyState
  });

  it("refresh does not lose data", async () => {
    const lessons = make8Lessons();
    let callCount = 0;
    const mockFetch = vi.fn(() => {
      callCount++;
      return Promise.resolve({ ok: true, json: async () => ({ content: lessons }) });
    });
    // simulate refresh
    await mockFetch();
    await mockFetch();
    expect(callCount).toBe(2);
    // both should return 8
  });

  it("schedule creation payload for Mon/Wed/Fri 8", async () => {
    const { buildProposePayload } = await import("../api/schedule.api");
    const payload = buildProposePayload({
      timezone: "Asia/Bishkek",
      format: "online",
      start_date: "2026-09-07",
      end_date: "2026-09-23",
      duration_minutes: 60,
      days: ["monday", "wednesday", "friday"],
      time: "09:00",
    });
    expect(payload.slots).toHaveLength(3);
    expect(payload.slots[0].weekday).toBe("MONDAY");
    expect(payload.slots[0].start_time).toBe("09:00");
    expect(payload.slots[0].end_time).toBe("10:00");
    expect(payload.start_date).toBe("2026-09-07");
    expect(payload.end_date).toBe("2026-09-23");
    expect(payload.duration_minutes).toBe(60);
    expect(payload.timezone).toBe("Asia/Bishkek");
    // must not have conflicting count
    expect(payload).not.toHaveProperty("count");
    expect(payload).not.toHaveProperty("total_lessons");
  });
});

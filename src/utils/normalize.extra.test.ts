import { describe, it, expect } from "vitest";
import { normalizeLesson, normalizeNotification, getNotificationTypeKey } from "./normalize";

describe("normalizeLesson extra", () => {
  it("handles null", () => {
    expect(normalizeLesson(null)).toBeNull();
    expect(normalizeLesson(undefined)?.id).toBeNull();
  });
  it("normalizes full lesson", () => {
    const raw = {
      id: 1,
      course_id: 10,
      course_title: "Math",
      tutor_name: "Bob",
      start_at: "2026-09-01T10:00:00Z",
      end_at: "2026-09-01T11:00:00Z",
      status: "SCHEDULED",
      can_join: true,
    };
    const n = normalizeLesson(raw);
    expect(n?.courseTitle).toBe("Math");
    expect(n?.canJoin).toBe(true);
    expect(n?.status).toBe("SCHEDULED");
  });
  it("handles pending fields", () => {
    const raw = {
      id: 2,
      status: "RESCHEDULE_PENDING",
      pending_start_at: "2026-09-02T10:00:00Z",
      pending_reason: "test",
    };
    const n = normalizeLesson(raw);
    expect(n?.pendingStartAt).toBe("2026-09-02T10:00:00Z");
    expect(n?.pendingReason).toBe("test");
  });
});

describe("normalizeNotification", () => {
  it("handles MESSAGE", () => {
    const raw = { id: 1, type: "MESSAGE", message: "MESSAGE New message from John: hello", payload: {} };
    const n = normalizeNotification(raw);
    expect(n["params"]).toBeDefined();
  });
  it("handles APPLICATION_CANCELLED", () => {
    const raw = { id: 2, type: "APPLICATION_CANCELLED", message: "APPLICATION_CANCELLED Alice cancelled", payload: {} };
    const n = normalizeNotification(raw);
    expect(n["params"]).toBeDefined();
  });
});

describe("getNotificationTypeKey", () => {
  it("maps known", () => {
    expect(getNotificationTypeKey("MESSAGE")).toBe("notifications.types.NEW_MESSAGE");
  });
  it("fallback", () => {
    expect(getNotificationTypeKey("UNKNOWN_X")).toBe("notifications.types.UNKNOWN_X");
  });
});

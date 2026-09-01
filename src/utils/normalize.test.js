import { describe, it, expect } from "vitest";
import { normalizeEnrollment, normalizeCourse, normalizeUser } from "./normalize";

describe("normalizeEnrollment", () => {
  it("normalizes full enrollment with nested course and student", () => {
    const raw = {
      id: 5,
      status: "PENDING",
      course_id: 10,
      course_title: "Math",
      student_name: "John",
      preferred_schedule: "Mon 18:00-20:00",
      preferred_days: ["monday"],
      preferred_start_time: "18:00",
      preferred_end_time: "20:00",
      message: "hello",
      created_at: "2026-01-01T00:00:00Z",
    };
    const n = normalizeEnrollment(raw);
    expect(n.id).toBe(5);
    expect(n.status).toBe("PENDING");
    expect(n.course_id).toBe(10);
    expect(n.course_title).toBe("Math");
    expect(n.preferred_days).toEqual(["monday"]);
  });

  it("falls back to course.title and student.full_name", () => {
    const raw = {
      _id: "abc",
      enrollment_status: "ACCEPTED",
      course: { id: 7, title: "English" },
      student: { id: 2, full_name: "Alice" },
      courseId: 9,
    };
    const n = normalizeEnrollment(raw);
    expect(n.id).toBe("abc");
    expect(n.status).toBe("ACCEPTED");
    expect(n.course_id).toBe(7);
    expect(n.course_title).toBe("English");
    expect(n.student_name).toBe("Alice");
  });

  it("handles missing raw gracefully", () => {
    const n = normalizeEnrollment();
    expect(n.status).toBe("PENDING");
    expect(n.id).toBeNull();
  });

  it("prefers alternate field names", () => {
    const raw = {
      enrollment_id: 99,
      status: "SCHEDULED",
      courseTitle: "X",
      studentName: "Y",
      preferredSchedule: "sched",
      preferredStartTime: "09:00",
    };
    const n = normalizeEnrollment(raw);
    expect(n.id).toBe(99);
  });
});

describe("normalizeCourse", () => {
  it("normalizes teacher fields", () => {
    const raw = { id: 1, title: "T", teacher_id: 5, teacher_name: "Bob", price_per_hour: 100 };
    const n = normalizeCourse(raw);
    expect(n.id).toBe(1);
    expect(n.teacher_name).toBe("Bob");
    expect(n.price_per_hour).toBe(100);
  });

  it("falls back to nested teacher and alternate names", () => {
    const raw = { _id: 2, name: "Alt", teacher: { id: 3, full_name: "Ann", avatar: "a.jpg" }, price: 200 };
    const n = normalizeCourse(raw);
    expect(n.id).toBe(2);
    expect(n.title).toBe("Alt");
    expect(n.teacher_id).toBe(3);
    expect(n.teacher_name).toBe("Ann");
    expect(n.teacher_avatar).toBe("a.jpg");
    expect(n.price).toBe(200);
  });

  it("handles empty input", () => {
    const n = normalizeCourse();
    expect(n.id).toBeNull();
    expect(n.title).toBe("");
  });
});

describe("normalizeUser", () => {
  it("normalizes full_name and email", () => {
    const raw = { id: 1, full_name: "John Doe", email: "j@x.com", role: "TUTOR" };
    const n = normalizeUser(raw);
    expect(n.full_name).toBe("John Doe");
    expect(n.role).toBe("TUTOR");
  });

  it("falls back to name and _id", () => {
    const raw = { _id: "u1", name: "Bob", avatar_url: "url" };
    const n = normalizeUser(raw);
    expect(n.id).toBe("u1");
    expect(n.full_name).toBe("Bob");
    expect(n.avatar).toBe("url");
  });

  it("handles empty", () => {
    const n = normalizeUser();
    expect(n.id).toBeNull();
  });
});

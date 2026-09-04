import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrollmentsApi } from "./enrollments.api";
import { apiClient } from "./http";

vi.mock("./http", () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ response: { ok: true }, data: {} })),
    post: vi.fn(() => Promise.resolve({ response: { ok: true }, data: {} })),
    request: vi.fn(() => Promise.resolve({ response: { ok: true }, data: {} })),
  },
}));

describe("enrollmentsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("byId calls correct endpoint", async () => {
    await enrollmentsApi.byId("123");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/enrollments/123");
  });

  it("tutorRequests calls correct endpoint", async () => {
    await enrollmentsApi.tutorRequests();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/tutors/me/requests");
  });

  it("accept calls post", async () => {
    await enrollmentsApi.accept("1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/enrollments/1/accept");
  });

  it("acceptAndSchedule sends payload", async () => {
    const payload = { date: "2026-01-01", time: "10:00", duration_minutes: 60 };
    await enrollmentsApi.acceptAndSchedule("1", payload);
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/enrollments/1/accept-and-schedule", payload);
  });

  it("reject sends payload or empty", async () => {
    await enrollmentsApi.reject("1", { reason: "no" });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/enrollments/1/reject", { reason: "no" });
    await enrollmentsApi.reject("1");
    expect(apiClient.post).toHaveBeenLastCalledWith("/api/v1/enrollments/1/reject", {});
  });

  it("requestInfo and provideInfo send fixed { message } contract", async () => {
    await enrollmentsApi.requestInfo("1", "What time works for you?");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/applications/1/request-info", {
      message: "What time works for you?",
    });
    await enrollmentsApi.provideInfo("1", "ans");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/applications/1/submit-info", { message: "ans" });
  });

  it("forCourse", async () => {
    await enrollmentsApi.forCourse("c1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/courses/c1/enrollment");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { studentsApi } from "./students.api";
import { apiClient } from "./http";

vi.mock("./http", () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ response: { ok: true }, data: [] })),
    post: vi.fn(() => Promise.resolve({ response: { ok: true }, data: {} })),
    request: vi.fn(() => Promise.resolve({ response: { ok: true }, data: {} })),
  },
}));

describe("studentsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("myEnrollments calls GET", async () => {
    await studentsApi.myEnrollments();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/students/me/enrollments");
  });

  it("requestCourse posts to enroll", async () => {
    await studentsApi.requestCourse("c1", { message: "hi" });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/courses/c1/enroll", { message: "hi" });
  });

  it("cancelEnrollment DELETEs", async () => {
    await studentsApi.cancelEnrollment("e1");
    expect(apiClient.request).toHaveBeenCalledWith("DELETE", "/api/v1/enrollments/e1");
  });
});

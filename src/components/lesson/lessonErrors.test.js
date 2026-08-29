import { describe, expect, it } from "vitest";
import { resolveLessonJoinError } from "./lessonErrors";

const t = (key, fallback) => fallback;

describe("resolveLessonJoinError", () => {
  it("maps 401 to a session-expired message", () => {
    expect(resolveLessonJoinError({ status: 401 }, t)).toBe(
      "Your session has expired. Please sign in again."
    );
  });

  it("maps 403 to an access-denied message", () => {
    expect(resolveLessonJoinError({ status: 403 }, t)).toBe(
      "You do not have access to this lesson."
    );
  });

  it("maps 404 to a not-found message", () => {
    expect(resolveLessonJoinError({ status: 404 }, t)).toBe(
      "Lesson not found. It may have been cancelled."
    );
  });

  it("maps 409 to a retry message", () => {
    expect(resolveLessonJoinError({ status: 409 }, t)).toBe(
      "Failed to connect to the lesson. Please try opening it again."
    );
  });

  it("maps 500 to a generic retry message", () => {
    expect(resolveLessonJoinError({ status: 500 }, t)).toBe(
      "Failed to connect to the lesson. Please try opening it again."
    );
  });

  it("maps network-level errors without a status to a generic retry message", () => {
    expect(resolveLessonJoinError({ name: "ApiRequestError" }, t)).toBe(
      "Failed to connect to the lesson. Please try opening it again."
    );
    expect(resolveLessonJoinError(null, t)).toBe(
      "Failed to connect to the lesson. Please try opening it again."
    );
  });
});
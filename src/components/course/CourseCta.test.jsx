import { describe, it, expect } from "vitest";
import { resolveCourseCta } from "./CourseCta";
import { ENROLLMENT_STATUS } from "../../constants/enums";

describe("resolveCourseCta", () => {
  it("returns null for owner", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.PENDING, { isOwner: true, isAuthenticated: true })).toBeNull();
  });
  it("returns null for unauthenticated", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.PENDING, { isOwner: false, isAuthenticated: false })).toBeNull();
  });
  it("maps NOT_REQUESTED to apply", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.NOT_REQUESTED, { isOwner: false, isAuthenticated: true })).toEqual({ type: "apply", key: "application.title" });
  });
  it("maps PENDING", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.PENDING, { isOwner: false, isAuthenticated: true }).type).toBe("pending");
  });
  it("maps NEEDS_INFO", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.NEEDS_INFO, { isOwner: false, isAuthenticated: true }).type).toBe("needs_info");
  });
  it("maps ACCEPTED and SCHEDULE_PENDING to schedule_pending", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.ACCEPTED, { isOwner: false, isAuthenticated: true }).type).toBe("schedule_pending");
    expect(resolveCourseCta(ENROLLMENT_STATUS.SCHEDULE_PENDING, { isOwner: false, isAuthenticated: true }).type).toBe("schedule_pending");
  });
  it("maps SCHEDULE_PROPOSED to confirm_schedule", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.SCHEDULE_PROPOSED, { isOwner: false, isAuthenticated: true }).type).toBe("confirm_schedule");
  });
  it("maps SCHEDULED to view_schedule", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.SCHEDULED, { isOwner: false, isAuthenticated: true }).type).toBe("view_schedule");
  });
  it("maps COMPLETED to review", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.COMPLETED, { isOwner: false, isAuthenticated: true }).type).toBe("review");
  });
  it("maps REJECTED to rejected", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.REJECTED, { isOwner: false, isAuthenticated: true }).type).toBe("rejected");
  });
  it("maps CANCELLED and EXPIRED to apply", () => {
    expect(resolveCourseCta(ENROLLMENT_STATUS.CANCELLED, { isOwner: false, isAuthenticated: true }).type).toBe("apply");
    expect(resolveCourseCta(ENROLLMENT_STATUS.EXPIRED, { isOwner: false, isAuthenticated: true }).type).toBe("apply");
  });
  it("defaults unknown to apply", () => {
    expect(resolveCourseCta("UNKNOWN", { isOwner: false, isAuthenticated: true }).type).toBe("apply");
  });
});

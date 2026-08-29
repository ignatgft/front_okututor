import { describe, it, expect } from "vitest";
import {
  enrollmentStatusKey,
  bookingStatusKey,
  lessonStatusKey,
} from "./statusLabels";
import { ENROLLMENT_STATUS, BOOKING_STATUS, LESSON_STATUS } from "../constants/enums";

describe("statusLabels", () => {
  it("maps enrollment statuses to human-readable i18n keys", () => {
    expect(enrollmentStatusKey(ENROLLMENT_STATUS.PENDING)).toBe("enrollment_status.pending");
    expect(enrollmentStatusKey(ENROLLMENT_STATUS.ACCEPTED)).toBe("enrollment_status.accepted");
    expect(enrollmentStatusKey(ENROLLMENT_STATUS.REJECTED)).toBe("enrollment_status.rejected");
    expect(enrollmentStatusKey(ENROLLMENT_STATUS.CANCELLED)).toBe("enrollment_status.cancelled");
    expect(enrollmentStatusKey(ENROLLMENT_STATUS.NOT_REQUESTED)).toBe("enrollment_status.not_requested");
  });

  it("falls back to pending for unknown enrollment status", () => {
    expect(enrollmentStatusKey("SOMETHING_ELSE")).toBe("enrollment_status.pending");
  });

  it("maps booking statuses to statuses.* keys", () => {
    expect(bookingStatusKey(BOOKING_STATUS.CONFIRMED)).toBe("statuses.CONFIRMED");
    expect(bookingStatusKey(BOOKING_STATUS.COMPLETED)).toBe("statuses.COMPLETED");
  });

  it("maps lesson statuses to statuses.* keys", () => {
    expect(lessonStatusKey(LESSON_STATUS.IN_PROGRESS)).toBe("statuses.IN_PROGRESS");
    expect(lessonStatusKey(LESSON_STATUS.SCHEDULED)).toBe("statuses.SCHEDULED");
  });
});

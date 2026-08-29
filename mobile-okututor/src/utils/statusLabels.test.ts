import { describe, it, expect } from "vitest";
import {
  bookingStatusKey,
  bookingStatusLabel,
  enrollmentStatusKey,
  enrollmentStatusLabel,
  lessonStatusKey,
  lessonStatusLabel,
  type TranslateFn,
} from "./statusLabels";
import { BOOKING_STATUS, ENROLLMENT_STATUS, LESSON_STATUS } from "../constants/enums";

const fakeT = ((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key) as unknown as TranslateFn;

describe("status label keys", () => {
  it("maps enrollment statuses to i18n keys", () => {
    expect(enrollmentStatusKey(ENROLLMENT_STATUS.PENDING)).toBe("enrollment_status.pending");
    expect(enrollmentStatusKey(undefined)).toBe("enrollment_status.pending");
  });

  it("maps booking statuses to statuses.* keys and falls back to the raw status", () => {
    expect(bookingStatusKey(BOOKING_STATUS.CONFIRMED)).toBe("statuses.CONFIRMED");
    expect(bookingStatusKey("WEIRD")).toBe("WEIRD");
  });

  it("maps lesson statuses and falls back to the raw status", () => {
    expect(lessonStatusKey(LESSON_STATUS.COMPLETED)).toBe("statuses.COMPLETED");
    expect(lessonStatusKey("WEIRD")).toBe("WEIRD");
  });

  it("labels: translations win, otherwise the raw status is the default", () => {
    expect(bookingStatusLabel(BOOKING_STATUS.CONFIRMED, fakeT)).toBe(BOOKING_STATUS.CONFIRMED);
    expect(enrollmentStatusLabel(ENROLLMENT_STATUS.ACCEPTED, fakeT)).toBe(ENROLLMENT_STATUS.ACCEPTED);
    expect(lessonStatusLabel(LESSON_STATUS.CANCELLED, fakeT)).toBe(LESSON_STATUS.CANCELLED);
  });
});
import { ENROLLMENT_STATUS, BOOKING_STATUS, LESSON_STATUS } from "../constants/enums";
import type { TFunction } from "i18next";

const ENROLLMENT_LABEL_KEYS: Record<string, string> = {
  [ENROLLMENT_STATUS.NOT_REQUESTED]: "enrollment_status.not_requested",
  [ENROLLMENT_STATUS.PENDING]: "enrollment_status.pending",
  [ENROLLMENT_STATUS.ACCEPTED]: "enrollment_status.accepted",
  [ENROLLMENT_STATUS.REJECTED]: "enrollment_status.rejected",
  [ENROLLMENT_STATUS.CANCELLED]: "enrollment_status.cancelled",
  [ENROLLMENT_STATUS.COMPLETED]: "enrollment_status.completed",
};

const BOOKING_LABEL_KEYS: Record<string, string> = {
  [BOOKING_STATUS.PENDING]: "statuses.PENDING",
  [BOOKING_STATUS.CONFIRMED]: "statuses.CONFIRMED",
  [BOOKING_STATUS.REJECTED]: "statuses.REJECTED",
  [BOOKING_STATUS.CANCELLED]: "statuses.CANCELLED",
  [BOOKING_STATUS.COMPLETED]: "statuses.COMPLETED",
};

const LESSON_LABEL_KEYS: Record<string, string> = {
  [LESSON_STATUS.SCHEDULED]: "statuses.SCHEDULED",
  [LESSON_STATUS.IN_PROGRESS]: "statuses.IN_PROGRESS",
  [LESSON_STATUS.COMPLETED]: "statuses.COMPLETED",
  [LESSON_STATUS.CANCELLED]: "statuses.CANCELLED",
};

export function enrollmentStatusKey(status: string | undefined): string {
  return ENROLLMENT_LABEL_KEYS[status || ""] || "enrollment_status.pending";
}

export function bookingStatusKey(status: string | undefined): string {
  return BOOKING_LABEL_KEYS[status || ""] || status || "";
}

export function lessonStatusKey(status: string | undefined): string {
  return LESSON_LABEL_KEYS[status || ""] || status || "";
}

export type TranslateFn = TFunction;

export function enrollmentStatusLabel(status: string | undefined, t: TranslateFn): string {
  return String(t(enrollmentStatusKey(status), { defaultValue: status ?? "" }));
}

export function bookingStatusLabel(status: string | undefined, t: TranslateFn): string {
  return String(t(bookingStatusKey(status), { defaultValue: status ?? "" }));
}

export function lessonStatusLabel(status: string | undefined, t: TranslateFn): string {
  return String(t(lessonStatusKey(status), { defaultValue: status ?? "" }));
}
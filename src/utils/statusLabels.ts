import { ENROLLMENT_STATUS, BOOKING_STATUS, LESSON_STATUS } from "../constants/enums";

export const APPLICATION_LABEL_KEYS: Record<string, string> = {
  [ENROLLMENT_STATUS.NOT_REQUESTED]: "statuses.NOT_REQUESTED",
  [ENROLLMENT_STATUS.PENDING]: "statuses.PENDING",
  [ENROLLMENT_STATUS.NEEDS_INFO]: "statuses.NEEDS_INFO",
  [ENROLLMENT_STATUS.ACCEPTED]: "statuses.ACCEPTED",
  [ENROLLMENT_STATUS.SCHEDULE_PENDING]: "statuses.SCHEDULE_PENDING",
  [ENROLLMENT_STATUS.SCHEDULE_PROPOSED]: "statuses.SCHEDULE_PROPOSED",
  [ENROLLMENT_STATUS.SCHEDULED]: "statuses.SCHEDULED",
  [ENROLLMENT_STATUS.REJECTED]: "statuses.REJECTED",
  [ENROLLMENT_STATUS.CANCELLED]: "statuses.CANCELLED",
  [ENROLLMENT_STATUS.EXPIRED]: "statuses.EXPIRED",
  [ENROLLMENT_STATUS.COMPLETED]: "statuses.COMPLETED",
};

const ENROLLMENT_LABEL_KEYS: Record<string, string> = {
  [ENROLLMENT_STATUS.NOT_REQUESTED]: "enrollment_status.not_requested",
  [ENROLLMENT_STATUS.PENDING]: "enrollment_status.pending",
  [ENROLLMENT_STATUS.NEEDS_INFO]: "enrollment_status.needs_info",
  [ENROLLMENT_STATUS.ACCEPTED]: "enrollment_status.accepted",
  [ENROLLMENT_STATUS.SCHEDULE_PENDING]: "enrollment_status.schedule_pending",
  [ENROLLMENT_STATUS.SCHEDULE_PROPOSED]: "enrollment_status.schedule_proposed",
  [ENROLLMENT_STATUS.SCHEDULED]: "enrollment_status.scheduled",
  [ENROLLMENT_STATUS.REJECTED]: "enrollment_status.rejected",
  [ENROLLMENT_STATUS.CANCELLED]: "enrollment_status.cancelled",
  [ENROLLMENT_STATUS.EXPIRED]: "enrollment_status.expired",
  [ENROLLMENT_STATUS.COMPLETED]: "enrollment_status.completed",
};

const BOOKING_LABEL_KEYS: Record<string, string> = {
  [BOOKING_STATUS.PENDING]: "statuses.PENDING",
  [BOOKING_STATUS.CONFIRMED]: "statuses.CONFIRMED",
  [BOOKING_STATUS.REJECTED]: "statuses.REJECTED",
  [BOOKING_STATUS.CANCELLED]: "statuses.CANCELLED",
  [BOOKING_STATUS.COMPLETED]: "statuses.COMPLETED",
  PROPOSED: "statuses.PROPOSED",
  RESCHEDULED: "statuses.RESCHEDULED",
  NO_SHOW: "statuses.NO_SHOW",
};

const LESSON_LABEL_KEYS: Record<string, string> = {
  [LESSON_STATUS.SCHEDULED]: "statuses.SCHEDULED",
  [LESSON_STATUS.IN_PROGRESS]: "statuses.IN_PROGRESS",
  [LESSON_STATUS.COMPLETED]: "statuses.COMPLETED",
  [LESSON_STATUS.CANCELLED]: "statuses.CANCELLED",
};

export function applicationStatusKey(status: string): string {
  return APPLICATION_LABEL_KEYS[status] ?? ENROLLMENT_LABEL_KEYS[status] ?? "statuses.PENDING";
}

export function applicationStatusLabel(status: string, t: (key: string, fallback: string) => string): string {
  return t(applicationStatusKey(status), status);
}

export function enrollmentStatusKey(status: string): string {
  return ENROLLMENT_LABEL_KEYS[status] ?? "enrollment_status.pending";
}

export function bookingStatusKey(status: string): string {
  return BOOKING_LABEL_KEYS[status] ?? status ?? "";
}

export function lessonStatusKey(status: string): string {
  return LESSON_LABEL_KEYS[status] ?? status ?? "";
}

export function enrollmentStatusLabel(status: string, t: (key: string, fallback: string) => string): string {
  return t(enrollmentStatusKey(status), status);
}

export function bookingStatusLabel(status: string, t: (key: string, fallback: string) => string): string {
  return t(bookingStatusKey(status), status);
}

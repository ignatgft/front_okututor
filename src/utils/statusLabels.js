import { ENROLLMENT_STATUS, BOOKING_STATUS, LESSON_STATUS } from "../constants/enums";

const ENROLLMENT_LABEL_KEYS = {
  [ENROLLMENT_STATUS.NOT_REQUESTED]: "enrollment_status.not_requested",
  [ENROLLMENT_STATUS.PENDING]: "enrollment_status.pending",
  [ENROLLMENT_STATUS.ACCEPTED]: "enrollment_status.accepted",
  [ENROLLMENT_STATUS.REJECTED]: "enrollment_status.rejected",
  [ENROLLMENT_STATUS.CANCELLED]: "enrollment_status.cancelled",
  [ENROLLMENT_STATUS.COMPLETED]: "enrollment_status.completed",
};

const BOOKING_LABEL_KEYS = {
  [BOOKING_STATUS.PENDING]: "statuses.PENDING",
  [BOOKING_STATUS.CONFIRMED]: "statuses.CONFIRMED",
  [BOOKING_STATUS.REJECTED]: "statuses.REJECTED",
  [BOOKING_STATUS.CANCELLED]: "statuses.CANCELLED",
  [BOOKING_STATUS.COMPLETED]: "statuses.COMPLETED",
};

const LESSON_LABEL_KEYS = {
  [LESSON_STATUS.SCHEDULED]: "statuses.SCHEDULED",
  [LESSON_STATUS.IN_PROGRESS]: "statuses.IN_PROGRESS",
  [LESSON_STATUS.COMPLETED]: "statuses.COMPLETED",
  [LESSON_STATUS.CANCELLED]: "statuses.CANCELLED",
};

export function enrollmentStatusKey(status) {
  return ENROLLMENT_LABEL_KEYS[status] || "enrollment_status.pending";
}

export function bookingStatusKey(status) {
  return BOOKING_LABEL_KEYS[status] || status || "";
}

export function lessonStatusKey(status) {
  return LESSON_LABEL_KEYS[status] || status || "";
}

export function enrollmentStatusLabel(status, t) {
  return t(enrollmentStatusKey(status), status);
}

export function bookingStatusLabel(status, t) {
  return t(bookingStatusKey(status), status);
}

import { ROLES, ADMIN_ROLES, isTutorLike as _isTutorLike, getPermissions, hasPermission } from "./roles";

export { ROLES, ADMIN_ROLES, getPermissions, hasPermission };

export const isTutorLike = (user: unknown): boolean => {
  if (typeof user === "object" && user !== null && "role" in user) {
    const role = (user as { role: unknown }).role;
    return _isTutorLike(role);
  }
  return false;
};

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  DELETED: "DELETED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const TUTOR_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;

export type TutorStatus = (typeof TUTOR_STATUS)[keyof typeof TUTOR_STATUS];

export const COURSE_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;

export type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

export const ENROLLMENT_STATUS = {
  NOT_REQUESTED: "NOT_REQUESTED",
  PENDING: "PENDING",
  NEEDS_INFO: "NEEDS_INFO",
  ACCEPTED: "ACCEPTED",
  SCHEDULE_PENDING: "SCHEDULE_PENDING",
  SCHEDULE_PROPOSED: "SCHEDULE_PROPOSED",
  SCHEDULED: "SCHEDULED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  COMPLETED: "COMPLETED",
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

export const ENROLLMENT_ACTIVE_STATUSES: readonly EnrollmentStatus[] = [
  ENROLLMENT_STATUS.PENDING,
  ENROLLMENT_STATUS.NEEDS_INFO,
  ENROLLMENT_STATUS.ACCEPTED,
  ENROLLMENT_STATUS.SCHEDULE_PENDING,
  ENROLLMENT_STATUS.SCHEDULE_PROPOSED,
];

export const LESSON_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type LessonStatus = (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const REPORT_TYPE = {
  USER: "USER",
  TUTOR: "TUTOR",
  COURSE: "COURSE",
  REVIEW: "REVIEW",
  LESSON: "LESSON",
} as const;

export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

export const REPORT_STATUS = {
  OPEN: "OPEN",
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const NOTIFICATION_TYPES = {
  NEW_REQUEST: "NEW_REQUEST",
  REQUEST_ACCEPTED: "REQUEST_ACCEPTED",
  REQUEST_REJECTED: "REQUEST_REJECTED",
  LESSON_REMINDER: "LESSON_REMINDER",
  LESSON_CANCELLED: "LESSON_CANCELLED",
  NEW_MESSAGE: "NEW_MESSAGE",
  NEW_REVIEW: "NEW_REVIEW",
  TUTOR_APPROVED: "TUTOR_APPROVED",
  TUTOR_REJECTED: "TUTOR_REJECTED",
  COURSE_APPROVED: "COURSE_APPROVED",
  COURSE_REJECTED: "COURSE_REJECTED",
  SUPPORT_MESSAGE: "SUPPORT_MESSAGE",
  SUPPORT_TICKET_CREATED: "SUPPORT_TICKET_CREATED",
  SUPPORT_TICKET_ASSIGNED: "SUPPORT_TICKET_ASSIGNED",
  SUPPORT_TICKET_RESOLVED: "SUPPORT_TICKET_RESOLVED",
  SUPPORT_TICKET_CLOSED: "SUPPORT_TICKET_CLOSED",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

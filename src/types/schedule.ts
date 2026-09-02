/**
 * Unified Schedule Types for OkuTutor
 * Single source of truth for Lesson, Schedule Actions, and View types
 */

// ============================================
// LESSON STATUS MODEL (Domain Separation)
// ============================================

/**
 * Application — ещё не урок, это заявка на курс
 * ScheduleNegotiation — процесс согласования расписания
 * PendingConfirmation — расписание предложено, ждёт подтверждения
 * Scheduled — подтверждённый урок
 * InProgress — идёт прямо сейчас
 * Completed — завершённый
 * Cancelled — отменённый
 * Rescheduled — перенесённый
 */
export type LessonStatus =
  | "APPLICATION"
  | "SCHEDULE_NEGOTIATION"
  | "PENDING_CONFIRMATION"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

/** Localized label for status display */
export const LessonStatusLabel: Record<LessonStatus, string> = {
  APPLICATION: "Заявка",
  SCHEDULE_NEGOTIATION: "Согласование",
  PENDING_CONFIRMATION: "Ожидает подтверждения",
  SCHEDULED: "Подтверждено",
  IN_PROGRESS: "Идёт сейчас",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  RESCHEDULED: "Перенесено",
};

/** Status color mapping (uses design tokens) */
export const LessonStatusColor: Record<LessonStatus, string> = {
  APPLICATION: "var(--color-status-application, #8b5cf6)",       // purple
  SCHEDULE_NEGOTIATION: "var(--color-status-negotiation, #a855f7)", // purple
  PENDING_CONFIRMATION: "var(--color-status-pending, #eab308)",    // yellow
  SCHEDULED: "var(--color-status-confirmed, #22c55e)",             // green
  IN_PROGRESS: "var(--color-status-in-progress, #3b82f6)",         // blue
  COMPLETED: "var(--color-status-completed, #71717a)",             // neutral
  CANCELLED: "var(--color-status-cancelled, #ef4444)",             // red
  RESCHEDULED: "var(--color-status-rescheduled, #06b6d4)",         // cyan
};

// ============================================
// LESSON DTO (Backend Contract)
// ============================================

export interface LessonDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  studentId: string;
  startAt: string;           // UTC ISO 8601
  endAt: string;             // UTC ISO 8601
  timezone: string;          // IANA timezone (e.g., "Asia/Bishkek")
  status: LessonStatus;
  statusLabel: string;       // Localized label from backend
  format: "ONLINE" | "OFFLINE";
  meetingRoomId?: string;
  meetingUrl?: string;
  location?: string;
  // Permissions — backend is source of truth
  canJoin: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canReview: boolean;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** Minimal lesson for calendar views */
export interface LessonMinimal {
  id: string;
  courseTitle: string;
  tutorName?: string;
  studentName?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: LessonStatus;
  format: "ONLINE" | "OFFLINE";
  canJoin: boolean;
}

// ============================================
// SCHEDULE ACTIONS (Action Required Block)
// ============================================

export type ScheduleActionType =
  | "SCHEDULE_NEGOTIATION"
  | "RESCHEDULE_CONFIRMATION"
  | "TIME_PROPOSAL"
  | "APPLICATION_CONFIRMATION"
  | "PAYMENT_REQUIRED"
  | "LESSON_CONFIRMATION";

export interface ScheduleAction {
  id: string;
  type: ScheduleActionType;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  proposedStartAt?: string;
  proposedEndAt?: string;
  timezone?: string;
  primaryAction: ActionButton;
  secondaryAction?: ActionButton;
  createdAt: string;
}

export interface ActionButton {
  label: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  variant: "primary" | "secondary" | "danger";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// ============================================
// VIEW TYPES
// ============================================

export type ScheduleView = "day" | "week" | "month";

export const ScheduleViewLabel: Record<ScheduleView, string> = {
  day: "Сегодня",
  week: "Неделя",
  month: "Месяц",
};

export interface ScheduleViewState {
  view: ScheduleView;
  date: string; // ISO date string (YYYY-MM-DD) for day/week, month start for month
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface NextLessonResponse {
  nextLesson: LessonDTO | null;
}

export interface ScheduleActionsResponse {
  actions: ScheduleAction[];
}

export interface DayScheduleResponse {
  date: string;
  lessons: LessonDTO[];
}

export interface WeekScheduleResponse {
  weekStart: string;
  days: DayLessons[];
}

export interface DayLessons {
  date: string;
  lessons: LessonDTO[];
}

export interface MonthScheduleResponse {
  year: number;
  month: number; // 1-12
  days: MonthDay[];
}

export interface MonthDay {
  date: string;
  lessonCount: number;
  hasLessons: boolean;
  lessons?: LessonMinimal[]; // Optional, for day click expansion
}

// ============================================
// FILTER TYPES
// ============================================

export interface ScheduleFilters {
  courseIds: string[];      // Empty = all courses
  statuses: LessonStatus[]; // Empty = all statuses
}

export interface CourseOption {
  id: string;
  title: string;
  tutorName?: string;
}

// ============================================
// MUTATION TYPES
// ============================================

export interface JoinLessonResponse {
  meetingUrl: string;
  meetingRoomId: string;
}

export interface CancelLessonRequest {
  reason?: string;
}

export interface RescheduleLessonRequest {
  newStartAt: string;  // UTC ISO
  newEndAt: string;    // UTC ISO
  timezone: string;    // IANA
}

export interface ReviewLessonRequest {
  rating: number;      // 1-5
  comment?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
  isSoon: boolean; // Within 15 minutes
}

export interface TimeDisplay {
  date: string;        // Localized date (e.g., "1 сентября 2026")
  time: string;        // Localized time range (e.g., "18:00–19:00")
  timezone: string;    // Display timezone (e.g., "Asia/Bishkek (GMT+6)")
  relative: string;    // Relative time (e.g., "Через 2 ч 14 мин" or "Начался 5 мин назад")
}

// ============================================
// TYPE GUARDS
// ============================================

export function isConfirmedLesson(lesson: LessonDTO): boolean {
  return lesson.status === "SCHEDULED" || lesson.status === "IN_PROGRESS";
}

export function isUpcomingLesson(lesson: LessonDTO): boolean {
  return lesson.status === "SCHEDULED" || lesson.status === "PENDING_CONFIRMATION";
}

export function isActionRequiredLesson(lesson: LessonDTO): boolean {
  return (
    lesson.status === "SCHEDULE_NEGOTIATION" ||
    lesson.status === "PENDING_CONFIRMATION" ||
    lesson.status === "APPLICATION"
  );
}

export function canLessonJoin(lesson: LessonDTO): boolean {
  return lesson.canJoin && (lesson.status === "SCHEDULED" || lesson.status === "IN_PROGRESS");
}

export function getLessonStatusColor(status: LessonStatus): string {
  return LessonStatusColor[status] || LessonStatusColor.COMPLETED;
}
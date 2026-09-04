import { ENROLLMENT_STATUS } from "../constants/enums";
import type { EnrollmentDTO } from "../types/api";

export const STUDENT_TABS: Record<string, string[]> = {
  awaiting: [ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.NEEDS_INFO, ENROLLMENT_STATUS.ACCEPTED],
  action: [ENROLLMENT_STATUS.SCHEDULE_PROPOSED, ENROLLMENT_STATUS.SCHEDULE_PENDING],
  active: [ENROLLMENT_STATUS.SCHEDULED],
  archive: [ENROLLMENT_STATUS.REJECTED, ENROLLMENT_STATUS.CANCELLED, ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.EXPIRED],
};

export const TUTOR_TABS: Record<string, string[]> = {
  new: [ENROLLMENT_STATUS.PENDING],
  waiting: [ENROLLMENT_STATUS.ACCEPTED, ENROLLMENT_STATUS.NEEDS_INFO],
  schedule: [ENROLLMENT_STATUS.SCHEDULE_PENDING, ENROLLMENT_STATUS.SCHEDULE_PROPOSED],
  active: [ENROLLMENT_STATUS.SCHEDULED],
  archive: [ENROLLMENT_STATUS.REJECTED, ENROLLMENT_STATUS.CANCELLED, ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.EXPIRED],
};

export function isTerminalStatus(status: string): boolean {
  return [ENROLLMENT_STATUS.REJECTED, ENROLLMENT_STATUS.CANCELLED, ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.EXPIRED].includes(
    status as never
  );
}

export function canStudentMessage(status: string): boolean {
  return !isTerminalStatus(status) && !!status;
}

export function canTutorMessage(status: string): boolean {
  return !!status && status !== ENROLLMENT_STATUS.EXPIRED;
}

export function canAssignSchedule(status: string): boolean {
  return [ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.ACCEPTED].includes(status as never);
}

export function canReschedule(status: string): boolean {
  return [ENROLLMENT_STATUS.SCHEDULE_PENDING, ENROLLMENT_STATUS.SCHEDULE_PROPOSED].includes(status as never);
}

export function canViewScheduleProposal(status: string): boolean {
  return [ENROLLMENT_STATUS.SCHEDULE_PROPOSED, ENROLLMENT_STATUS.SCHEDULE_PENDING, ENROLLMENT_STATUS.SCHEDULED].includes(
    status as never
  );
}

export function canStudentCancel(status: string): boolean {
  return [
    ENROLLMENT_STATUS.PENDING,
    ENROLLMENT_STATUS.NEEDS_INFO,
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.SCHEDULE_PROPOSED,
    ENROLLMENT_STATUS.SCHEDULE_PENDING,
  ].includes(status as never);
}

export function canStudentViewSchedule(status: string): boolean {
  return status === ENROLLMENT_STATUS.SCHEDULED;
}

export function canStudentConfirmSchedule(status: string): boolean {
  return status === ENROLLMENT_STATUS.SCHEDULE_PROPOSED;
}

export function canTutorAct(status: string): boolean {
  return [ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.NEEDS_INFO, ENROLLMENT_STATUS.ACCEPTED].includes(status as never);
}

export function canTutorRequestInfo(status: string): boolean {
  return status === ENROLLMENT_STATUS.PENDING || status === ENROLLMENT_STATUS.ACCEPTED;
}

export function canTutorReject(status: string): boolean {
  return canTutorAct(status);
}

export function canJoinLesson(startAt: string | null | undefined, now: number = Date.now()): boolean {
  if (!startAt) return false;
  const start = new Date(startAt).getTime();
  if (Number.isNaN(start)) return false;
  const diff = start - now;
  return diff < 10 * 60 * 1000 && diff > -30 * 60 * 1000;
}

export function getNextStudentAction(status: string): string | null {
  switch (status) {
    case ENROLLMENT_STATUS.PENDING:
    case ENROLLMENT_STATUS.NEEDS_INFO:
    case ENROLLMENT_STATUS.ACCEPTED:
      return "awaiting";
    case ENROLLMENT_STATUS.SCHEDULE_PROPOSED:
    case ENROLLMENT_STATUS.SCHEDULE_PENDING:
      return "view_proposal";
    case ENROLLMENT_STATUS.SCHEDULED:
      return "view_schedule";
    case ENROLLMENT_STATUS.COMPLETED:
      return "review";
    default:
      return null;
  }
}

export function getNextTutorAction(status: string): string | null {
  switch (status) {
    case ENROLLMENT_STATUS.PENDING:
      return "assign_schedule";
    case ENROLLMENT_STATUS.NEEDS_INFO:
    case ENROLLMENT_STATUS.ACCEPTED:
      return "assign_schedule";
    case ENROLLMENT_STATUS.SCHEDULE_PROPOSED:
    case ENROLLMENT_STATUS.SCHEDULE_PENDING:
      return "reschedule";
    case ENROLLMENT_STATUS.SCHEDULED:
      return "join_lesson";
    default:
      return null;
  }
}

export function openDirectChat(
  navigate: (path: string) => void,
  role: string,
  peerUserId: string | number | null | undefined
): void {
  const base = role === "TUTOR" || role === "ADMIN" || role === "SUPER_ADMIN" ? "/tutor/messages" : "/student/messages";
  const params = new URLSearchParams({ filter: "direct" });
  if (peerUserId) params.set("peer", String(peerUserId));
  navigate(`${base}?${params.toString()}`);
}

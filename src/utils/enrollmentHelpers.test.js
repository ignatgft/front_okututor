import { describe, it, expect, vi } from "vitest";
import { ENROLLMENT_STATUS } from "../constants/enums";
import {
  canStudentMessage,
  canTutorMessage,
  canAssignSchedule,
  canReschedule,
  canViewScheduleProposal,
  canStudentCancel,
  canTutorAct,
  canJoinLesson,
  openDirectChat,
  getNextStudentAction,
  getNextTutorAction,
  STUDENT_TABS,
  TUTOR_TABS,
} from "./enrollmentHelpers";

describe("enrollmentHelpers", () => {
  it("student tabs group correctly", () => {
    expect(STUDENT_TABS.awaiting).toContain(ENROLLMENT_STATUS.PENDING);
    expect(STUDENT_TABS.action).toContain(ENROLLMENT_STATUS.SCHEDULE_PROPOSED);
    expect(STUDENT_TABS.active).toContain(ENROLLMENT_STATUS.SCHEDULED);
    expect(STUDENT_TABS.archive).toContain(ENROLLMENT_STATUS.REJECTED);
  });

  it("tutor tabs group correctly", () => {
    expect(TUTOR_TABS.new).toContain(ENROLLMENT_STATUS.PENDING);
    expect(TUTOR_TABS.schedule).toContain(ENROLLMENT_STATUS.SCHEDULE_PROPOSED);
  });

  it("canStudentMessage false for terminal", () => {
    expect(canStudentMessage(ENROLLMENT_STATUS.COMPLETED)).toBe(false);
    expect(canStudentMessage(ENROLLMENT_STATUS.REJECTED)).toBe(false);
    expect(canStudentMessage(ENROLLMENT_STATUS.PENDING)).toBe(true);
    expect(canStudentMessage(null)).toBe(false);
  });

  it("canTutorMessage", () => {
    expect(canTutorMessage(ENROLLMENT_STATUS.PENDING)).toBe(true);
    expect(canTutorMessage(ENROLLMENT_STATUS.EXPIRED)).toBe(false);
  });

  it("canAssignSchedule only for PENDING, ACCEPTED", () => {
    expect(canAssignSchedule(ENROLLMENT_STATUS.PENDING)).toBe(true);
    expect(canAssignSchedule(ENROLLMENT_STATUS.NEEDS_INFO)).toBe(false);
    expect(canAssignSchedule(ENROLLMENT_STATUS.ACCEPTED)).toBe(true);
    expect(canAssignSchedule(ENROLLMENT_STATUS.SCHEDULE_PROPOSED)).toBe(false);
    expect(canAssignSchedule(ENROLLMENT_STATUS.SCHEDULED)).toBe(false);
  });

  it("canReschedule for pending/proposed only", () => {
    expect(canReschedule(ENROLLMENT_STATUS.SCHEDULE_PENDING)).toBe(true);
    expect(canReschedule(ENROLLMENT_STATUS.SCHEDULE_PROPOSED)).toBe(true);
    expect(canReschedule(ENROLLMENT_STATUS.SCHEDULED)).toBe(false);
    expect(canReschedule(ENROLLMENT_STATUS.PENDING)).toBe(false);
  });

  it("canViewScheduleProposal", () => {
    expect(canViewScheduleProposal(ENROLLMENT_STATUS.SCHEDULE_PROPOSED)).toBe(true);
    expect(canViewScheduleProposal(ENROLLMENT_STATUS.PENDING)).toBe(false);
  });

  it("canStudentCancel", () => {
    expect(canStudentCancel(ENROLLMENT_STATUS.PENDING)).toBe(true);
    expect(canStudentCancel(ENROLLMENT_STATUS.SCHEDULE_PROPOSED)).toBe(true);
    expect(canStudentCancel(ENROLLMENT_STATUS.SCHEDULED)).toBe(false);
    expect(canStudentCancel(ENROLLMENT_STATUS.REJECTED)).toBe(false);
  });

  it("canTutorAct", () => {
    expect(canTutorAct(ENROLLMENT_STATUS.PENDING)).toBe(true);
    expect(canTutorAct(ENROLLMENT_STATUS.SCHEDULED)).toBe(false);
  });

  it("canJoinLesson within window", () => {
    const now = Date.now();
    const startSoon = new Date(now + 5 * 60 * 1000).toISOString();
    const startFar = new Date(now + 30 * 60 * 1000).toISOString();
    const startPast = new Date(now - 10 * 60 * 1000).toISOString();
    expect(canJoinLesson(startSoon, now)).toBe(true);
    expect(canJoinLesson(startFar, now)).toBe(false);
    expect(canJoinLesson(startPast, now)).toBe(true);
    expect(canJoinLesson(null, now)).toBe(false);
    expect(canJoinLesson("invalid", now)).toBe(false);
  });

  it("getNextStudentAction", () => {
    expect(getNextStudentAction(ENROLLMENT_STATUS.PENDING)).toBe("awaiting");
    expect(getNextStudentAction(ENROLLMENT_STATUS.SCHEDULE_PROPOSED)).toBe("view_proposal");
    expect(getNextStudentAction(ENROLLMENT_STATUS.SCHEDULED)).toBe("view_schedule");
    expect(getNextStudentAction(ENROLLMENT_STATUS.COMPLETED)).toBe("review");
    expect(getNextStudentAction(ENROLLMENT_STATUS.REJECTED)).toBeNull();
  });

  it("getNextTutorAction", () => {
    expect(getNextTutorAction(ENROLLMENT_STATUS.PENDING)).toBe("assign_schedule");
    expect(getNextTutorAction(ENROLLMENT_STATUS.SCHEDULE_PROPOSED)).toBe("reschedule");
    expect(getNextTutorAction(ENROLLMENT_STATUS.SCHEDULED)).toBe("join_lesson");
  });

  it("openDirectChat navigates correctly", () => {
    const nav = vi.fn();
    openDirectChat(nav, "STUDENT", 123);
    expect(nav).toHaveBeenCalledWith("/student/messages?filter=direct&peer=123");
    openDirectChat(nav, "TUTOR", 456);
    expect(nav).toHaveBeenCalledWith("/tutor/messages?filter=direct&peer=456");
    openDirectChat(nav, "STUDENT", null);
    expect(nav).toHaveBeenCalledWith("/student/messages?filter=direct");
  });
});

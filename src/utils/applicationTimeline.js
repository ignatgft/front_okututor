import { ENROLLMENT_STATUS } from "../constants/enums";

/**
 * Build a display timeline for an application driven by its current status
 * (spec §14). The backend does not expose a full history endpoint yet, so we
 * render the canonical sequence up to the current state.
 *
 * Returns an array of { key, titleKey, state } where state ∈
 * "done" | "current" | "pending".
 */
const ORDERED_FLOW_STUDENT = [
  { key: "sent", titleKey: "request_detail.event_sent" },
  { key: "accepted", titleKey: "request_detail.event_accepted" },
  { key: "schedule_proposed", titleKey: "request_detail.event_schedule_proposed" },
  { key: "schedule_confirmed", titleKey: "request_detail.event_schedule_confirmed" },
];

const ORDERED_FLOW_TUTOR = [
  { key: "sent", titleKey: "request_detail.event_sent_tutor" },
  { key: "accepted", titleKey: "request_detail.event_accepted_tutor" },
  { key: "schedule_proposed", titleKey: "request_detail.event_schedule_proposed_tutor" },
  { key: "schedule_confirmed", titleKey: "request_detail.event_schedule_confirmed" },
];

// Which milestone each status has reached (index into ORDERED_FLOW).
// Increments here mean the step at that index has been completed; the status
// itself is the current result of that step.
const STATUS_TO_MILESTONE = {
  [ENROLLMENT_STATUS.PENDING]: 1,
  [ENROLLMENT_STATUS.NEEDS_INFO]: 1,
  [ENROLLMENT_STATUS.ACCEPTED]: 2,
  [ENROLLMENT_STATUS.SCHEDULE_PENDING]: 2,
  [ENROLLMENT_STATUS.SCHEDULE_PROPOSED]: 3,
  [ENROLLMENT_STATUS.SCHEDULED]: 4,
  [ENROLLMENT_STATUS.COMPLETED]: 4,
};

export function buildApplicationTimeline(status, opts = {}) {
  const role = opts.role === "tutor" ? "tutor" : "student";
  const flow = role === "tutor" ? ORDERED_FLOW_TUTOR : ORDERED_FLOW_STUDENT;
  const sentKey = role === "tutor" ? "request_detail.event_sent_tutor" : "request_detail.event_sent";
  const reached = STATUS_TO_MILESTONE[status];
  if (reached === undefined) {
    return [{ key: "sent", titleKey: sentKey, state: "done" }];
  }
  return flow.map((step, i) => ({
    ...step,
    state: i < reached ? "done" : i === reached ? "current" : "pending",
  }));
}

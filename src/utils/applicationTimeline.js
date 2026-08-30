import { ENROLLMENT_STATUS } from "../constants/enums";

/**
 * Build a display timeline for an application driven by its current status
 * (spec §14). The backend does not expose a full history endpoint yet, so we
 * render the canonical sequence up to the current state.
 *
 * Returns an array of { key, titleKey, state } where state ∈
 * "done" | "current" | "pending".
 */
const ORDERED_FLOW = [
  { key: "sent", titleKey: "request_detail.event_sent" },
  { key: "accepted", titleKey: "request_detail.event_accepted" },
  { key: "schedule_proposed", titleKey: "request_detail.event_schedule_proposed" },
  { key: "schedule_confirmed", titleKey: "request_detail.event_schedule_confirmed" },
];

// Which milestone each status has reached (index into ORDERED_FLOW).
const STATUS_TO_MILESTONE = {
  [ENROLLMENT_STATUS.PENDING]: 0,
  [ENROLLMENT_STATUS.NEEDS_INFO]: 0,
  [ENROLLMENT_STATUS.ACCEPTED]: 0,
  [ENROLLMENT_STATUS.SCHEDULE_PENDING]: 1,
  [ENROLLMENT_STATUS.SCHEDULE_PROPOSED]: 2,
  [ENROLLMENT_STATUS.SCHEDULED]: 3,
  [ENROLLMENT_STATUS.COMPLETED]: 3,
};

export function buildApplicationTimeline(status) {
  const reached = STATUS_TO_MILESTONE[status];
  if (reached === undefined) {
    return [
      { key: "sent", titleKey: "request_detail.event_sent", state: "done" },
    ];
  }
  return ORDERED_FLOW.map((step, i) => ({
    ...step,
    state: i < reached ? "done" : i === reached ? "current" : "pending",
  }));
}

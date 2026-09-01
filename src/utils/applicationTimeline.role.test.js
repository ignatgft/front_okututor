import { describe, it, expect } from "vitest";
import { buildApplicationTimeline } from "./applicationTimeline";
import { ENROLLMENT_STATUS } from "../constants/enums";

describe("role-aware timeline", () => {
  it("student timeline for PENDING", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.PENDING, { role: "student" });
    expect(tl[0].titleKey).toBe("request_detail.event_sent");
    expect(tl[1].titleKey).toBe("request_detail.event_accepted");
  });

  it("tutor timeline for PENDING", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.PENDING, { role: "tutor" });
    expect(tl[0].titleKey).toBe("request_detail.event_sent_tutor");
    expect(tl[1].titleKey).toBe("request_detail.event_accepted_tutor");
    expect(tl[1].state).toBe("current");
  });

  it("tutor timeline for SCHEDULE_PROPOSED", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULE_PROPOSED, { role: "tutor" });
    expect(tl[2].titleKey).toBe("request_detail.event_schedule_proposed_tutor");
    expect(tl[2].state).toBe("done");
    expect(tl[3].state).toBe("current");
  });

  it("student timeline for SCHEDULE_PROPOSED", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULE_PROPOSED, { role: "student" });
    expect(tl[2].titleKey).toBe("request_detail.event_schedule_proposed");
  });

  it("defaults to student when no role", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.PENDING);
    expect(tl[0].titleKey).toBe("request_detail.event_sent");
  });

  it("SCHEDULED all done for both roles", () => {
    const s = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULED, { role: "student" });
    const t = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULED, { role: "tutor" });
    expect(s[3].state).toBe("done");
    expect(t[3].state).toBe("done");
  });
});

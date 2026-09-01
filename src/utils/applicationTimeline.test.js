import { describe, it, expect } from "vitest";
import { buildApplicationTimeline } from "./applicationTimeline";
import { ENROLLMENT_STATUS } from "../constants/enums";

describe("buildApplicationTimeline", () => {
  it("returns done for unknown status (e.g. REJECTED) fallback", () => {
    const t = buildApplicationTimeline(ENROLLMENT_STATUS.REJECTED);
    expect(t.length).toBe(1);
    expect(t[0].state).toBe("done");
  });

  it("returns done for NOT_REQUESTED", () => {
    const t = buildApplicationTimeline(ENROLLMENT_STATUS.NOT_REQUESTED);
    expect(t[0].state).toBe("done");
  });

  it("PENDING marks first step done, second current", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.PENDING);
    expect(tl[0].state).toBe("done");
    expect(tl[1].state).toBe("current");
  });

  it("NEEDS_INFO same as PENDING", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.NEEDS_INFO);
    expect(tl[0].state).toBe("done");
    expect(tl[1].state).toBe("current");
  });

  it("ACCEPTED reaches schedule_proposed step", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.ACCEPTED);
    expect(tl[0].state).toBe("done");
    expect(tl[1].state).toBe("done");
    expect(tl[2].state).toBe("current");
  });

  it("SCHEDULE_PENDING same as ACCEPTED", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULE_PENDING);
    expect(tl[2].state).toBe("current");
  });

  it("SCHEDULE_PROPOSED marks third done, fourth current", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULE_PROPOSED);
    expect(tl[2].state).toBe("done");
    expect(tl[3].state).toBe("current");
  });

  it("SCHEDULED marks all done", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.SCHEDULED);
    expect(tl.every((s) => s.state !== "pending")).toBe(true);
    expect(tl[3].state).toBe("done");
  });

  it("COMPLETED same as SCHEDULED", () => {
    const tl = buildApplicationTimeline(ENROLLMENT_STATUS.COMPLETED);
    expect(tl[3].state).toBe("done");
  });

  it("handles undefined status gracefully", () => {
    const tl = buildApplicationTimeline(undefined);
    expect(tl.length).toBeGreaterThan(0);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { scheduleApi, buildProposePayload } from "./schedule.api";
import { apiClient } from "./http";

vi.mock("./http", () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ response: { ok: true }, data: [] })),
    post: vi.fn(() => Promise.resolve({ response: { ok: true }, data: {} })),
  },
}));

describe("scheduleApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("propose calls correct endpoint with payload", async () => {
    const payload = { timezone: "UTC", start_date: "2026-09-02", end_date: "2026-09-30", duration_minutes: 60, slots: [] };
    await scheduleApi.propose("app123", payload);
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/schedule/applications/app123/propose", payload);
  });

  it("listProposals", async () => {
    await scheduleApi.listProposals("app123");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/schedule/applications/app123/proposals");
  });

  it("getProposal", async () => {
    await scheduleApi.getProposal("prop1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/schedule/proposals/prop1");
  });

  it("acceptProposal", async () => {
    await scheduleApi.acceptProposal("prop1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/schedule/proposals/prop1/accept");
  });

  it("rejectProposal", async () => {
    await scheduleApi.rejectProposal("prop1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/schedule/proposals/prop1/reject");
  });

  it("counterProposal", async () => {
    const p = { timezone: "UTC", start_date: "2026-09-02", end_date: "2026-09-30", duration_minutes: 60, slots: [] };
    await scheduleApi.counterProposal("prop1", p);
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/schedule/proposals/prop1/counter", p);
  });

  it("mySchedules", async () => {
    await scheduleApi.mySchedules();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/schedule/me");
  });
});

describe("buildProposePayload", () => {
  it("builds slots from days and time", () => {
    const p = buildProposePayload({
      timezone: "Asia/Bishkek",
      format: "online",
      start_date: "2026-09-02",
      end_date: "2026-09-30",
      duration_minutes: 60,
      days: ["monday", "wednesday"],
      time: "09:00",
      location: null,
    });
    expect(p.timezone).toBe("Asia/Bishkek");
    expect(p.format).toBe("ONLINE");
    expect(p.slots).toHaveLength(2);
    expect(p.slots[0]).toEqual({ weekday: "MONDAY", start_time: "09:00", end_time: "10:00" });
    expect(p.slots[1].weekday).toBe("WEDNESDAY");
  });

  it("handles offline location", () => {
    const p = buildProposePayload({
      timezone: "UTC",
      format: "offline",
      start_date: "2026-09-02",
      end_date: "2026-09-30",
      duration_minutes: 90,
      days: ["saturday"],
      time: "10:00",
      location: { address: "Main 1", details: "Office", place: "center" },
    });
    expect(p.location_address).toBe("Main 1");
    expect(p.location_details).toBe("Office");
    expect(p.location_type).toBe("CENTER");
  });

  it("computes end_time correctly across midnight", () => {
    const p = buildProposePayload({
      timezone: "UTC",
      start_date: "2026-09-02",
      end_date: "2026-09-30",
      duration_minutes: 90,
      days: ["monday"],
      time: "23:30",
    });
    expect(p.slots[0].end_time).toBe("01:00");
  });
});

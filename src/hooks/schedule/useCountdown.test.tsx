import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown, formatCountdown, canJoinFromCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns zero for null target", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.days).toBe(0);
    expect(result.current.isPast).toBe(false);
  });

  it("counts down to future date", () => {
    const future = new Date(Date.now() + 65_000).toISOString();
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current.totalMs).toBeGreaterThan(0);
    expect(result.current.isPast).toBe(false);
    // advance 2s
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.totalMs).toBeGreaterThan(0);
  });

  it("isPast when target in past", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const { result } = renderHook(() => useCountdown(past));
    expect(result.current.isPast).toBe(true);
  });

  it("isSoon within 15 min", () => {
    const soon = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(soon));
    expect(result.current.isSoon).toBe(true);
  });
});

describe("formatCountdown", () => {
  const t = (key: string, fallback: string) => fallback;
  it("formats past", () => {
    expect(formatCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true, isSoon: false }, t)).toBe("Урок начался");
  });
  it("formats days/hours", () => {
    expect(formatCountdown({ days: 1, hours: 2, minutes: 0, seconds: 5, totalMs: 1000, isPast: false, isSoon: false }, t)).toContain("1");
  });
});

describe("canJoinFromCountdown", () => {
  it("allows IN_PROGRESS", () => {
    expect(canJoinFromCountdown({ isPast: false, isSoon: false } as never, "IN_PROGRESS")).toBe(true);
  });
  it("denies non-SCHEDULED", () => {
    expect(canJoinFromCountdown({ isPast: false, isSoon: true } as never, "CANCELLED")).toBe(false);
  });
  it("allows SCHEDULED within 15min", () => {
    expect(canJoinFromCountdown({ isPast: false, isSoon: true } as never, "SCHEDULED")).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { detectTimezone, getUserTimezone, formatInTimezone, formatTimeInTimezone, toUtcInput, timezoneLabel, IANA_TIMEZONES } from "./timezone";

describe("timezone utils", () => {
  it("detectTimezone returns string", () => {
    const tz = detectTimezone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });

  it("getUserTimezone falls back to detectTimezone when no user", () => {
    const tz = getUserTimezone();
    expect(typeof tz).toBe("string");
  });

  it("IANA_TIMEZONES contains UTC and known zones", () => {
    expect(IANA_TIMEZONES).toContain("UTC");
    expect(IANA_TIMEZONES).toContain("Asia/Bishkek");
    expect(IANA_TIMEZONES).toContain("Europe/London");
  });

  it("formatInTimezone returns empty for falsy iso", () => {
    expect(formatInTimezone(null)).toBe("");
    expect(formatInTimezone("invalid")).toBe("");
  });

  it("formatInTimezone formats valid iso", () => {
    const out = formatInTimezone("2026-01-01T12:00:00Z", "UTC", "en", { year: "numeric", month: "2-digit", day: "2-digit" });
    expect(out).toContain("2026");
  });

  it("formatTimeInTimezone returns time string", () => {
    const out = formatTimeInTimezone("2026-01-01T12:00:00Z", "UTC", "en");
    expect(out).toMatch(/\d/);
  });

  it("toUtcInput converts wall clock to UTC iso", () => {
    const iso = toUtcInput("2026-01-01", "12:00", "UTC");
    expect(iso).toContain("2026-01-01");
    expect(iso.endsWith("Z")).toBe(true);
  });

  it("toUtcInput handles fallback timezone", () => {
    const iso = toUtcInput("2026-01-01", "00:00", null);
    expect(typeof iso).toBe("string");
  });

  it("timezoneLabel returns string with timezone", () => {
    const label = timezoneLabel("UTC");
    expect(label).toContain("UTC");
    const label2 = timezoneLabel("Invalid/Zone");
    expect(label2).toBe("Invalid/Zone");
  });
});

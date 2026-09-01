import { describe, it, expect } from "vitest";
import { getErrorMessage, extractErrorCode, ERROR_CODE_KEYS } from "./errorMessage";

const t = (key, fallback) => {
  const map = {
    "errors.scheduleConflict": "Slot taken",
    "errors.default": "Something went wrong.",
    "errors.reviewNotAllowed": "Review blocked",
  };
  return map[key] || fallback || key;
};

describe("extractErrorCode", () => {
  it("returns null for falsy", () => {
    expect(extractErrorCode(null)).toBeNull();
    expect(extractErrorCode(undefined)).toBeNull();
  });
  it("returns string directly", () => {
    expect(extractErrorCode("SCHEDULE_CONFLICT")).toBe("SCHEDULE_CONFLICT");
  });
  it("prefers code over error", () => {
    expect(extractErrorCode({ code: "A", error: "B" })).toBe("A");
    expect(extractErrorCode({ error: "SCHEDULE_CONFLICT" })).toBe("SCHEDULE_CONFLICT");
  });
});

describe("getErrorMessage", () => {
  it("maps known backend code via t", () => {
    expect(getErrorMessage({ error: "SCHEDULE_CONFLICT" }, t)).toBe("Slot taken");
    expect(getErrorMessage({ code: "SCHEDULE_CONFLICT" }, t)).toBe("Slot taken");
  });
  it("maps REVIEW_NOT_ALLOWED", () => {
    expect(getErrorMessage({ error: "REVIEW_NOT_ALLOWED" }, t)).toBe("Review blocked");
  });
  it("handles errors.* string code via t", () => {
    expect(getErrorMessage({ code: "errors.scheduleConflict" }, t)).toBe("Slot taken");
  });
  it("falls back to error.message", () => {
    expect(getErrorMessage({ message: "custom msg" }, t)).toBe("custom msg");
  });
  it("falls back to default translation", () => {
    expect(getErrorMessage({}, t)).toBe("Something went wrong.");
    expect(getErrorMessage({ error: "UNKNOWN_CODE" }, t)).toBe("Something went wrong.");
  });
  it("supports all ERROR_CODE_KEYS mapping without throwing", () => {
    Object.keys(ERROR_CODE_KEYS).forEach((code) => {
      expect(() => getErrorMessage({ error: code }, t)).not.toThrow();
    });
  });
});

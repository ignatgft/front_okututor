import { describe, it, expect } from "vitest";
import { isNetworkError, isRetryableError, toErrorMessage } from "./error";
import { API_ERROR_CODES } from "../api/client/errorMapper";

describe("toErrorMessage", () => {
  it("returns fallback for nullish input", () => {
    expect(toErrorMessage(null)).toBe("Something went wrong.");
    expect(toErrorMessage(undefined, "custom")).toBe("custom");
  });

  it("passes strings through", () => {
    expect(toErrorMessage("oops")).toBe("oops");
  });

  it("reads Error.message", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("reads data.message / data.error before message", () => {
    expect(toErrorMessage({ data: { message: "server says no" }, message: "client" })).toBe("server says no");
    expect(toErrorMessage({ data: { error: "server error" } })).toBe("server error");
  });

  it("falls back", () => {
    expect(toErrorMessage({})).toBe("Something went wrong.");
  });
});

describe("isNetworkError / isRetryableError", () => {
  it("recognizes network and timeout codes", () => {
    expect(isNetworkError({ code: API_ERROR_CODES.NETWORK_ERROR })).toBe(true);
    expect(isNetworkError({ code: API_ERROR_CODES.TIMEOUT })).toBe(true);
    expect(isNetworkError({ code: API_ERROR_CODES.UNAUTHORIZED })).toBe(false);
  });

  it("reads the retryable flag", () => {
    expect(isRetryableError({ retryable: true })).toBe(true);
    expect(isRetryableError({ retryable: false })).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});
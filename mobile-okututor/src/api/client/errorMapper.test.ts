import { describe, it, expect } from "vitest";
import { API_ERROR_CODES, ApiRequestError, normalizeApiError } from "./errorMapper";

describe("normalizeApiError", () => {
  it("maps 401 to UNAUTHORIZED", () => {
    const n = normalizeApiError({ status: 401 });
    expect(n.code).toBe(API_ERROR_CODES.UNAUTHORIZED);
    expect(n.retryable).toBe(false);
  });

  it("maps 503 to SERVER_ERROR (retryable)", () => {
    const n = normalizeApiError({ status: 503 });
    expect(n.code).toBe(API_ERROR_CODES.SERVER_ERROR);
    expect(n.retryable).toBe(true);
  });

  it("maps abort causes to TIMEOUT", () => {
    const n = normalizeApiError({ cause: { name: "AbortError" } });
    expect(n.code).toBe(API_ERROR_CODES.TIMEOUT);
  });

  it("unknown status without cause becomes NETWORK_ERROR", () => {
    const n = normalizeApiError();
    expect(n.code).toBe(API_ERROR_CODES.NETWORK_ERROR);
  });

  it("extracts backend message and prefers explicit message", () => {
    const n = normalizeApiError({ status: 400, data: { message: "Bad payload" }, message: "Prefer me" });
    expect(n.message).toBe("Prefer me");
  });

  it("extracts error field when message is missing", () => {
    const n = normalizeApiError({ status: 422, data: { error: "Validation failed" } });
    expect(n.message).toBe("Validation failed");
  });

  it("collects field errors", () => {
    const n = normalizeApiError({ status: 400, data: { errors: { title: "required" } } });
    expect(n.fieldErrors).toEqual({ title: "required" });
  });

  it("falls back to a stable default message", () => {
    expect(normalizeApiError({ status: 500 }).message).toContain("Server error");
  });
});

describe("ApiRequestError", () => {
  it("carries normalized fields", () => {
    const err = new ApiRequestError(normalizeApiError({ status: 429 }));
    expect(err.code).toBe(API_ERROR_CODES.RATE_LIMIT);
    expect(err.retryable).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});
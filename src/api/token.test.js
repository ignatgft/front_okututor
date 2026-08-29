import { describe, it, expect, beforeEach } from "vitest";
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
} from "./token";

describe("token storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves both tokens", () => {
    setTokens("a1", "r1");
    expect(getAccessToken()).toBe("a1");
    expect(getRefreshToken()).toBe("r1");
    expect(isAuthenticated()).toBe(true);
  });

  it("setTokens clears tokens when null is passed (prevents stale tokens)", () => {
    setTokens("a1", "r1");
    setTokens(null, null);
    expect(getAccessToken()).toBe(null);
    expect(getRefreshToken()).toBe(null);
  });

  it("clearTokens removes both tokens", () => {
    setTokens("a1", "r1");
    clearTokens();
    expect(getAccessToken()).toBe(null);
    expect(getRefreshToken()).toBe(null);
    expect(isAuthenticated()).toBe(false);
  });
});

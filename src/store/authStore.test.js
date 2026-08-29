import { describe, it, expect, vi, beforeEach } from "vitest";
import useAuthStore, { AUTH_STATUS } from "./authStore";

vi.mock("../api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

import { getCurrentUser, logout as apiLogout } from "../api/auth";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    status: AUTH_STATUS.UNAUTHENTICATED,
  });
});

describe("authStore state machine", () => {
  it("treats a missing token as anonymous after init", async () => {
    await useAuthStore.getState().init();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
    expect(useAuthStore.getState().user).toBe(null);
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("restores the user via /me when a token exists", async () => {
    sessionStorage.setItem("access_token", "tok");
    localStorage.setItem("refresh_token", "rtok");
    getCurrentUser.mockResolvedValue({ id: 7, role: "TUTOR" });

    await useAuthStore.getState().init();

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED);
    expect(useAuthStore.getState().user.role).toBe("TUTOR");
  });

  it("clears auth state when /me fails", async () => {
    sessionStorage.setItem("access_token", "tok");
    localStorage.setItem("refresh_token", "rtok");
    getCurrentUser.mockRejectedValue(new Error("unauthorized"));

    await useAuthStore.getState().init();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
    expect(sessionStorage.getItem("access_token")).toBe(null);
    expect(localStorage.getItem("refresh_token")).toBe(null);
  });

  it("logout clears tokens and returns to unauthenticated status", async () => {
    sessionStorage.setItem("access_token", "tok");
    useAuthStore.setState({
      user: { id: 1 },
      isAuthenticated: true,
      status: AUTH_STATUS.AUTHENTICATED,
    });

    await useAuthStore.getState().logout();

    expect(apiLogout).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBe(null);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
    expect(sessionStorage.getItem("access_token")).toBe(null);
  });

  it("setUser toggles between authenticated and unauthenticated", () => {
    useAuthStore.getState().setUser({ id: 3 });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.AUTHENTICATED);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.UNAUTHENTICATED);
  });

  it("exposes AUTH_STATUS constants", () => {
    expect(AUTH_STATUS.INITIALIZING).toBe("initializing");
    expect(AUTH_STATUS.AUTHENTICATED).toBe("authenticated");
    expect(AUTH_STATUS.UNAUTHENTICATED).toBe("unauthenticated");
  });
});

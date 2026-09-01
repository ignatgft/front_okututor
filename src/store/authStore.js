import { create } from "zustand";
import { getCurrentUser, logout as apiLogout } from "../api/auth";
import { isAuthenticated, clearTokens, areTokensConsistent } from "../api/token";

/**
 * Auth state machine.
 *
 *   initializing ──▶ authenticated
 *        │               │
 *        └──▶ unauthenticated ◀── (logout / failed restore)
 *
 * `status` is the source of truth; `isAuthenticated` is a derived flag kept
 * for existing consumers.
 */
export const AUTH_STATUS = {
  INITIALIZING: "initializing",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
};

const useAuthStore = create((set) => ({
  user: null,
  status: AUTH_STATUS.INITIALIZING,
  isAuthenticated: false,

  init: async () => {
    if (!isAuthenticated() || !areTokensConsistent()) {
      clearTokens();
      set({
        status: AUTH_STATUS.UNAUTHENTICATED,
        isAuthenticated: false,
        user: null,
      });
      return;
    }
    try {
      const user = await getCurrentUser();
      if (user) {
        set({
          user,
          status: AUTH_STATUS.AUTHENTICATED,
          isAuthenticated: true,
        });
      } else {
        clearTokens();
        set({
          user: null,
          status: AUTH_STATUS.UNAUTHENTICATED,
          isAuthenticated: false,
        });
      }
    } catch (e) {
      // Network/timeout/server errors should NOT clear tokens — otherwise a 2s Wi-Fi blip logs user out
      // Only clear on confirmed auth failures (401/403 handled above as `user === null`)
      const isRetryable = e?.retryable || e?.code === "NETWORK_ERROR" || e?.code === "TIMEOUT" || e?.code === "SERVER_ERROR" || e?.code === "RATE_LIMIT";
      if (isRetryable) {
        set({
          user: null,
          status: AUTH_STATUS.UNAUTHENTICATED,
          isAuthenticated: false,
        });
        return;
      }
      clearTokens();
      set({
        user: null,
        status: AUTH_STATUS.UNAUTHENTICATED,
        isAuthenticated: false,
      });
    }
  },

  setUser: (user) =>
    set(
      user
        ? { user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true }
        : { user: null, status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false }
    ),

  login: (user) =>
    set({ user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true }),

  logout: async () => {
    await apiLogout().catch(() => {});
    clearTokens();
    set({
      user: null,
      status: AUTH_STATUS.UNAUTHENTICATED,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;

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
  OFFLINE: "offline",
};

const useAuthStore = create((set, get) => ({
  user: null,
  status: AUTH_STATUS.INITIALIZING,
  isAuthenticated: false,
  initError: null,

  init: async () => {
    // do not clear isAuthenticated while retrying offline – keep previous session if retryable
    if (!isAuthenticated() || !areTokensConsistent()) {
      clearTokens();
      set({
        status: AUTH_STATUS.UNAUTHENTICATED,
        isAuthenticated: false,
        user: null,
        initError: null,
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
          initError: null,
        });
      } else {
        clearTokens();
        set({
          user: null,
          status: AUTH_STATUS.UNAUTHENTICATED,
          isAuthenticated: false,
          initError: null,
        });
      }
    } catch (e) {
      // Network/timeout/server errors should NOT clear tokens — otherwise a 2s Wi-Fi blip logs user out
      // Only clear on confirmed auth failures (401/403 handled above as `user === null`)
      const isRetryable = e?.retryable || e?.code === "NETWORK_ERROR" || e?.code === "TIMEOUT" || e?.code === "SERVER_ERROR" || e?.code === "RATE_LIMIT";
      if (isRetryable) {
        // keep tokens, expose offline state so UI can show "no network / retry" instead of redirecting to login
        set({
          user: null,
          status: AUTH_STATUS.OFFLINE,
          isAuthenticated: false,
          initError: e?.message || "Network error",
        });
        return;
      }
      clearTokens();
      set({
        user: null,
        status: AUTH_STATUS.UNAUTHENTICATED,
        isAuthenticated: false,
        initError: e?.message || null,
      });
    }
  },

  retryInit: async () => {
    set({ status: AUTH_STATUS.INITIALIZING, initError: null });
    return get().init();
  },

  setUser: (user) =>
    set(
      user
        ? { user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true, initError: null }
        : { user: null, status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false, initError: null }
    ),

  login: (user) =>
    set({ user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true, initError: null }),

  logout: async () => {
    await apiLogout().catch(() => {});
    clearTokens();
    set({
      user: null,
      status: AUTH_STATUS.UNAUTHENTICATED,
      isAuthenticated: false,
      initError: null,
    });
  },
}));

export default useAuthStore;

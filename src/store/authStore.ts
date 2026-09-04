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
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export interface User {
  id: string | number;
  role: string;
  full_name?: string;
  email?: string;
  avatar?: string | null;
  [key: string]: unknown;
}

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  initError: string | null;
  init: () => Promise<void>;
  retryInit: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRetryableError(error: unknown): boolean {
  if (!isRecord(error)) return false;
  if (error["retryable"] === true) return true;
  const code = error["code"];
  return (
    code === "NETWORK_ERROR" ||
    code === "TIMEOUT" ||
    code === "SERVER_ERROR" ||
    code === "RATE_LIMIT"
  );
}

function getErrorMessage(error: unknown): string | null {
  if (isRecord(error) && typeof error["message"] === "string") {
    return error["message"] as string;
  }
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }
  return null;
}

// Typed wrappers for JS interop - underlying JS modules are untyped (allowJs), so we assert via unknown.
type GetCurrentUserFn = () => Promise<User | null>;
type ApiLogoutFn = () => Promise<void>;
type IsAuthenticatedFn = () => boolean;
type AreTokensConsistentFn = () => boolean;
type ClearTokensFn = () => void;

const typedGetCurrentUser = getCurrentUser as unknown as GetCurrentUserFn;
const typedApiLogout = apiLogout as unknown as ApiLogoutFn;
const typedIsAuthenticated = isAuthenticated as unknown as IsAuthenticatedFn;
const typedAreTokensConsistent = areTokensConsistent as unknown as AreTokensConsistentFn;
const typedClearTokens = clearTokens as unknown as ClearTokensFn;

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: AUTH_STATUS.INITIALIZING,
  isAuthenticated: false,
  initError: null,

  init: async () => {
    // do not clear isAuthenticated while retrying offline – keep previous session if retryable
    if (!typedIsAuthenticated() || !typedAreTokensConsistent()) {
      typedClearTokens();
      set({
        status: AUTH_STATUS.UNAUTHENTICATED,
        isAuthenticated: false,
        user: null,
        initError: null,
      });
      return;
    }
    try {
      const user = await typedGetCurrentUser();
      if (user) {
        set({
          user,
          status: AUTH_STATUS.AUTHENTICATED,
          isAuthenticated: true,
          initError: null,
        });
      } else {
        typedClearTokens();
        set({
          user: null,
          status: AUTH_STATUS.UNAUTHENTICATED,
          isAuthenticated: false,
          initError: null,
        });
      }
    } catch (error: unknown) {
      // Network/timeout/server errors should NOT clear tokens — otherwise a 2s Wi-Fi blip logs user out
      // Only clear on confirmed auth failures (401/403 handled above as `user === null`)
      const isRetryable = isRetryableError(error);
      if (isRetryable) {
        // keep tokens, expose offline state so UI can show "no network / retry" instead of redirecting to login
        set({
          user: null,
          status: AUTH_STATUS.OFFLINE,
          isAuthenticated: false,
          initError: getErrorMessage(error) ?? "Network error",
        });
        return;
      }
      typedClearTokens();
      set({
        user: null,
        status: AUTH_STATUS.UNAUTHENTICATED,
        isAuthenticated: false,
        initError: getErrorMessage(error),
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
    await typedApiLogout().catch((): void => {});
    typedClearTokens();
    set({
      user: null,
      status: AUTH_STATUS.UNAUTHENTICATED,
      isAuthenticated: false,
      initError: null,
    });
  },
}));

export default useAuthStore;

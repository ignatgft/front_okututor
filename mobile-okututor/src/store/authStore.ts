import { create } from "zustand";
import { getCurrentUser, logout as apiLogout } from "../api/auth";
import { isAuthenticated, areTokensConsistent, clearTokens } from "../api/token";
import { User } from "../types/user";

/**
 * Auth state machine.
 *
 *   initializing ──▶ authenticated
 *        │               │
 *        └──▶ unauthenticated ◀── (logout / failed restore)
 */
export const AUTH_STATUS = {
  INITIALIZING: "initializing",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

interface AuthState {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  init: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: AUTH_STATUS.INITIALIZING,
  isAuthenticated: false,

  init: async () => {
    const authed = await isAuthenticated();
    const consistent = await areTokensConsistent();
    if (!authed || !consistent) {
      await clearTokens();
      set({ status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await getCurrentUser();
      if (user) {
        set({ user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true });
      } else {
        await clearTokens();
        set({ user: null, status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false });
      }
    } catch {
      await clearTokens();
      set({ user: null, status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false });
    }
  },

  setUser: (user) =>
    set(
      user
        ? { user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true }
        : { user: null, status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false }
    ),

  login: (user) => set({ user, status: AUTH_STATUS.AUTHENTICATED, isAuthenticated: true }),

  logout: async () => {
    await apiLogout().catch(() => undefined);
    await clearTokens();
    set({ user: null, status: AUTH_STATUS.UNAUTHENTICATED, isAuthenticated: false });
  },
}));
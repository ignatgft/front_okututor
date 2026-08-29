import { create } from "zustand";
import { useAuthStore } from "./authStore";
import { User, UserUpdatePayload } from "../types/user";
import { usersApi } from "../api/tutors.api";

interface UserState {
  /** True while a profile mutation is in flight. */
  saving: boolean;
  updateUser: (payload: UserUpdatePayload) => Promise<{ ok: boolean; message?: string }>;
}

/**
 * Owns profile mutations; the current user record itself lives in authStore
 * (single source of truth). On successful update the authStore user is
 * refreshed so every screen sees the new values.
 */
export const useUserStore = create<UserState>((set) => ({
  saving: false,

  updateUser: async (payload) => {
    set({ saving: true });
    try {
      const { response, data } = await usersApi.updateMe(payload as Record<string, unknown>);
      if (!response.ok) {
        const d = data as { message?: string; error?: string } | null;
        return { ok: false, message: d?.message || d?.error || "Failed to update profile" };
      }
      const merged: User = {
        ...useAuthStore.getState().user,
        ...payload,
        ...(data as Partial<User>),
      } as User;
      useAuthStore.getState().setUser(merged);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Failed to update profile" };
    } finally {
      set({ saving: false });
    }
  },
}));
import { create } from "zustand";
import { notificationsApi } from "../api/messages.api";
import { emitAuthEvent } from "../security/authEvents";
import { AppNotification } from "../types/tutor";
import { toList } from "../types/api";

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string;
  fetchList: () => Promise<void>;
  fetchUnread: () => Promise<void>;
  markRead: (id: string | number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  error: "",

  fetchUnread: async () => {
    try {
      const { response, data } = await notificationsApi.unreadCount();
      if (response.ok && data) {
        set({ unreadCount: Number(data.count) || 0 });
      }
    } catch {
      // badge stays stale; never crash the UI for a badge
    }
  },

  fetchList: async () => {
    set({ loading: true, error: "" });
    try {
      const { response, data } = await notificationsApi.list();
      if (response.ok) {
        set({ items: toList<AppNotification>(data) });
        await get().fetchUnread();
      } else {
        set({ error: "notifications.error_load" });
      }
    } catch {
      set({ error: "notifications.error_load" });
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    await notificationsApi.markRead(id);
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    await get().fetchUnread();
    emitAuthEvent("notifications:refresh", undefined);
  },

  markAllRead: async () => {
    await notificationsApi.markAllRead();
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
    await get().fetchUnread();
    emitAuthEvent("notifications:refresh", undefined);
  },
}));
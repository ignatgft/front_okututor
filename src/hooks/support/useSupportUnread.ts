import { useState, useEffect, useCallback } from "react";
import { supportApi } from "../../api/support.api";
import type { SupportTicketDTO } from "../../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toList(data: unknown): SupportTicketDTO[] {
  if (Array.isArray(data)) return data as SupportTicketDTO[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as SupportTicketDTO[];
  return [];
}

export default function useSupportUnread(): number {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchCount = useCallback(async (): Promise<void> => {
    try {
      const { response, data } = await supportApi.getTickets("");
      if (response.ok) {
        const tickets = toList(data);
        const count = tickets.reduce((sum, t) => sum + (typeof t.unread_count === "number" ? t.unread_count : 0), 0);
        setUnreadCount(count);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    void fetchCount();
    const id = window.setInterval(() => { void fetchCount(); }, 30000);
    return () => window.clearInterval(id);
  }, [fetchCount]);

  return unreadCount;
}

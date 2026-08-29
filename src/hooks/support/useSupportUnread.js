import { useState, useEffect, useCallback } from "react";
import { supportApi } from "../../api/support.api";

export default function useSupportUnread() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const { response, data } = await supportApi.getTickets("");
      if (response.ok) {
        const tickets = data?.content || data || [];
        const count = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
        setUnreadCount(count);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  return unreadCount;
}

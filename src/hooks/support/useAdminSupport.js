import { useState, useEffect, useCallback } from "react";
import { adminSupportApi } from "../../api/support.api";

export default function useAdminSupport(filters = {}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildParams = useCallback(() => {
    const parts = [];
    if (filters.status) parts.push(`status=${filters.status}`);
    if (filters.category) parts.push(`category=${filters.category}`);
    if (filters.priority) parts.push(`priority=${filters.priority}`);
    if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`);
    return parts.length ? `?${parts.join("&")}` : "";
  }, [filters.status, filters.category, filters.priority, filters.search]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { response, data } = await adminSupportApi.getTickets(buildParams());
      if (response.ok) {
        setTickets(data?.content || data || []);
      } else {
        setError("Failed to load tickets");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    waiting: tickets.filter(t => t.status === "WAITING_FOR_USER" || t.status === "WAITING_FOR_SUPPORT").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
    closed: tickets.filter(t => t.status === "CLOSED").length,
  };

  return { tickets, loading, error, refetch: fetchTickets, stats };
}

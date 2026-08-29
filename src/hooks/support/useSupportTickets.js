import { useState, useEffect, useCallback } from "react";
import { supportApi } from "../../api/support.api";

export default function useSupportTickets(filter = "") {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter ? `?status=${filter}` : "";
      const { response, data } = await supportApi.getTickets(params);
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
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

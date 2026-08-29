import { useState, useEffect, useCallback } from "react";
import { supportApi } from "../../api/support.api";

export default function useSupportTicket(ticketId) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const { response, data } = await supportApi.getTicket(ticketId);
      if (response.ok) {
        setTicket(data);
      } else if (response.status === 404) {
        setError("NOT_FOUND");
      } else if (response.status === 403) {
        setError("FORBIDDEN");
      } else {
        setError("LOAD_ERROR");
      }
    } catch {
      setError("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  return { ticket, loading, error, refetch: fetchTicket, setTicket };
}

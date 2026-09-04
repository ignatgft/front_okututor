import { useState, useEffect, useCallback } from "react";
import { supportApi } from "../../api/support.api";
import type { SupportTicketDTO } from "../../types/api";

export type SupportTicketError = "NOT_FOUND" | "FORBIDDEN" | "LOAD_ERROR" | "NETWORK_ERROR" | null;

export interface UseSupportTicketReturn {
  ticket: SupportTicketDTO | null;
  loading: boolean;
  error: SupportTicketError;
  refetch: () => Promise<void>;
  setTicket: React.Dispatch<React.SetStateAction<SupportTicketDTO | null>>;
}

export default function useSupportTicket(ticketId: string | number | null | undefined): UseSupportTicketReturn {
  const [ticket, setTicket] = useState<SupportTicketDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<SupportTicketError>(null);

  const fetchTicket = useCallback(async (): Promise<void> => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const { response, data } = await supportApi.getTicket(ticketId);
      if (response.ok) {
        setTicket(data as SupportTicketDTO);
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

  useEffect(() => { void fetchTicket(); }, [fetchTicket]);

  return { ticket, loading, error, refetch: fetchTicket, setTicket };
}

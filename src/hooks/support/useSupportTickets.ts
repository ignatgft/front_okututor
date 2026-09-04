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

export interface UseSupportTicketsReturn {
  tickets: SupportTicketDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useSupportTickets(filter = ""): UseSupportTicketsReturn {
  const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = filter ? `?status=${filter}` : "";
      const { response, data } = await supportApi.getTickets(params);
      if (response.ok) {
        setTickets(toList(data));
      } else {
        setError("Failed to load tickets");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

import { useState, useEffect, useCallback, useMemo } from "react";
import { adminSupportApi } from "../../api/support.api";
import type { SupportTicketDTO } from "../../types/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toList(data: unknown): SupportTicketDTO[] {
  if (Array.isArray(data)) return data as SupportTicketDTO[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as SupportTicketDTO[];
  return [];
}

export interface AdminSupportFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}

export interface AdminSupportStats {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
}

export interface UseAdminSupportReturn {
  tickets: SupportTicketDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: AdminSupportStats;
}

export default function useAdminSupport(filters: AdminSupportFilters = {}): UseAdminSupportReturn {
  const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const buildParams = useCallback((): string => {
    const parts: string[] = [];
    if (filters.status) parts.push(`status=${filters.status}`);
    if (filters.category) parts.push(`category=${filters.category}`);
    if (filters.priority) parts.push(`priority=${filters.priority}`);
    if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`);
    return parts.length ? `?${parts.join("&")}` : "";
  }, [filters.status, filters.category, filters.priority, filters.search]);

  const fetchTickets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { response, data } = await adminSupportApi.getTickets(buildParams());
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
  }, [buildParams]);

  useEffect(() => { void fetchTickets(); }, [fetchTickets]);

  const stats: AdminSupportStats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    waiting: tickets.filter((t) => t.status === "WAITING_FOR_USER" || t.status === "WAITING_FOR_SUPPORT").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  }), [tickets]);

  return { tickets, loading, error, refetch: fetchTickets, stats };
}

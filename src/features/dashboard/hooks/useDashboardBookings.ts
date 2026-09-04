import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../../api/booking.api";
import type { BookingDTO } from "../../../types/api";

export type BookingFilter = "upcoming" | "past" | "cancelled" | "all";

export function useDashboardBookings(filter: BookingFilter = "upcoming"): {
  bookings: BookingDTO[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  filter: BookingFilter;
  setFilter: (f: BookingFilter) => void;
} {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await bookingApi.my();
      if (response.ok) {
        const all = (data as Record<string, unknown>)?.["content"] as BookingDTO[] | undefined ?? (data as BookingDTO[] | undefined) ?? [];
        const arr = Array.isArray(all) ? all : [];
        let filtered: BookingDTO[] = arr;
        if (filter === "upcoming") {
          const now = new Date();
          filtered = arr.filter((b) => (b.status === "CONFIRMED" || b.status === "PENDING") && new Date(b.start_at as string) > now);
        } else if (filter === "past") {
          filtered = arr.filter((b) => b.status === "COMPLETED");
        } else if (filter === "cancelled") {
          filtered = arr.filter((b) => b.status === "CANCELLED" || (b.status as string) === "REJECTED");
        }
        setBookings(filtered);
      } else {
        const rec = data as Record<string, unknown> | null;
        const msg = (rec?.["error"] as string | undefined) ?? (rec?.["message"] as string | undefined) ?? t("errors.default", "Something went wrong.") as string;
        setError(msg);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError((t("errors.network", "Network error") as string) + ": " + msg);
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => { void load(); }, [load]);

  return { bookings, loading, error, reload: load, filter, setFilter: (_f: BookingFilter) => { /* controlled via parent */ } } as never;
}

// Simpler version used by PgDashboard — keeps filter state outside
export function useDashboardBookingsState(initial: BookingFilter = "upcoming"): ReturnType<typeof useDashboardBookings> & { setFilter: (f: BookingFilter) => void } {
  const [filter, setFilter] = useState<BookingFilter>(initial);
  const hook = useDashboardBookings(filter);
  return { ...hook, filter, setFilter };
}

import { useState, useCallback } from "react";
import { useToast } from "../../../components/ui/Toast";
import { bookingApi } from "../../../api/booking.api";
import { useTranslation } from "react-i18next";

export function useDashboardActions(reloadBookings: () => Promise<void>): {
  cancelTarget: Record<string, unknown> | null;
  setCancelTarget: (v: Record<string, unknown> | null) => void;
  cancelling: boolean;
  cancelBooking: () => Promise<void>;
  reviewTarget: Record<string, unknown> | null;
  setReviewTarget: (v: Record<string, unknown> | null) => void;
  reviewedIds: (string | number)[];
  onReviewSubmitted: (b: Record<string, unknown>) => void;
  selectedLesson: unknown;
  setSelectedLesson: (v: unknown) => void;
} {
  const { t } = useTranslation();
  const toast = useToast();
  const [cancelTarget, setCancelTarget] = useState<Record<string, unknown> | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [reviewTarget, setReviewTarget] = useState<Record<string, unknown> | null>(null);
  const [reviewedIds, setReviewedIds] = useState<(string | number)[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<unknown>(null);

  const cancelBooking = useCallback(async (): Promise<void> => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(String(cancelTarget["id"] ?? ""));
      setCancelTarget(null);
      await reloadBookings();
      toast.success(t("dashboard.booking_cancelled", "Booking cancelled") as string);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || (t("errors.default", "Something went wrong.") as string));
    } finally {
      setCancelling(false);
    }
  }, [cancelTarget, reloadBookings, t, toast]);

  const onReviewSubmitted = useCallback((b: Record<string, unknown>): void => {
    setReviewedIds((prev) => [...prev, b["id"] as string | number]);
  }, []);

  return {
    cancelTarget,
    setCancelTarget,
    cancelling,
    cancelBooking,
    reviewTarget,
    setReviewTarget,
    reviewedIds,
    onReviewSubmitted,
    selectedLesson,
    setSelectedLesson,
  };
}

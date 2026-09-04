import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../api/booking.api";
import { usePageTitle } from "../components/pageTitleContext";
import ConfirmModal from "../components/ui/ConfirmModal";
import ReviewModal from "../components/ui/ReviewModal";
import { useToast } from "../components/ui/Toast";
import { useDashboardEnrollments } from "../features/dashboard/hooks/useDashboardEnrollments";
import { NextLessonWidget } from "../features/dashboard/components/NextLessonWidget";
import { MyTutorsWidget } from "../features/dashboard/components/MyTutorsWidget";
import { MyCoursesWidget } from "../features/dashboard/components/MyCoursesWidget";
import { ActionRequiredWidget } from "../features/dashboard/components/ActionRequiredWidget";
import { SchedulePreviewWidget } from "../features/dashboard/components/SchedulePreviewWidget";
import { DashboardGreeting } from "../features/dashboard/components/DashboardGreeting";
import { BookingHistoryWidget } from "../features/dashboard/components/BookingHistoryWidget";
import { LessonDetailsModal } from "../components/schedule";
import "../styles/Dashboard.css";

export default function PgDashboard(): JSX.Element {
  const { t } = useTranslation();
  const toast = useToast();
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState<string>("upcoming");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [cancelTarget, setCancelTarget] = useState<Record<string, unknown> | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [reviewTarget, setReviewTarget] = useState<Record<string, unknown> | null>(null);
  const [reviewedIds, setReviewedIds] = useState<(string | number)[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<unknown>(null);
  const { enrollments } = useDashboardEnrollments();
  const setPageTitle = usePageTitle();

  useEffect(() => { setPageTitle(t("dashboard.title") as string || "Главная"); }, [setPageTitle, t]);

  const loadBookings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await bookingApi.my();
      if (response.ok) {
        const all = (data as Record<string, unknown>)?.["content"] as Record<string, unknown>[] ?? (data as Record<string, unknown>[] | undefined) ?? [];
        const arr = Array.isArray(all) ? all : [];
        let filtered: Record<string, unknown>[] = arr;
        if (filter === "upcoming") {
          const now = new Date();
          filtered = arr.filter((b) => (b["status"] === "CONFIRMED" || b["status"] === "PENDING") && new Date(b["start_at"] as string) > now);
        } else if (filter === "past") {
          filtered = arr.filter((b) => b["status"] === "COMPLETED");
        } else if (filter === "cancelled") {
          filtered = arr.filter((b) => b["status"] === "CANCELLED" || b["status"] === "REJECTED");
        }
        setBookings(filtered);
      } else {
        const rec = data as Record<string, unknown> | null;
        setError((rec?.["error"] as string | undefined) ?? (rec?.["message"] as string | undefined) ?? t("errors.default", "Something went wrong.") as string);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError((t("errors.network", "Network error") as string) + ": " + msg);
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => { void loadBookings(); }, [loadBookings]);

  const cancelBooking = async (): Promise<void> => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(String(cancelTarget["id"] ?? ""));
      setCancelTarget(null);
      void loadBookings();
      toast.success(t("dashboard.booking_cancelled", "Booking cancelled") as string);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || (t("errors.default", "Something went wrong.") as string));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <DashboardGreeting />

      <NextLessonWidget />

      <ActionRequiredWidget enrollments={enrollments as never} />

      <MyTutorsWidget bookings={bookings as never} />

      <MyCoursesWidget bookings={bookings as never} />

      <SchedulePreviewWidget bookings={bookings as never} />

      <BookingHistoryWidget
        bookings={bookings as never}
        filter={filter}
        onFilterChange={setFilter}
        onCancel={setCancelTarget}
        onReview={setReviewTarget}
        reviewedIds={reviewedIds}
        loading={loading}
        error={error}
        onRetry={loadBookings}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        title={t("booking.cancel_title", "Cancel this lesson?") as string}
        message={t("booking.cancel_message", "Your booking request will be withdrawn.") as string}
        confirmLabel={t("booking.cancel_confirm", "Cancel booking") as string}
        loading={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={cancelBooking}
      />

      <ReviewModal
        isOpen={!!reviewTarget}
        booking={reviewTarget as never}
        onClose={() => setReviewTarget(null)}
        onSubmitted={(b) => setReviewedIds((prev) => [...prev, (b as Record<string, unknown>)["id"] as string | number])}
      />

      <LessonDetailsModal
        lesson={selectedLesson as never}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onChanged={() => { void loadBookings(); }}
      />
    </>
  );
}

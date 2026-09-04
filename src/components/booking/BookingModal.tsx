import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../api/booking.api";
import { useToast } from "../ui/Toast";
import SlotPicker from "./SlotPicker";
import CalendarPicker from "../ui/CalendarPicker";
import { getUserTimezone } from "../../utils/timezone";
import "../../styles/BookingModal.css";
import type { AvailabilitySlot, CourseDTO } from "../../types/api";

const toInputDate = (d: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export interface BookingModalProps {
  course: CourseDTO | null | undefined;
  availability?: AvailabilitySlot[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: unknown) => void;
}

export function BookingModal({
  course,
  availability = [],
  isOpen,
  onClose,
  onSuccess,
}: BookingModalProps): JSX.Element | null {
  const { t } = useTranslation();
  const toast = useToast();
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  const todayStr = toInputDate(new Date());
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const reset = (): void => {
    setDate("");
    setTime("");
    setDuration(60);
    setError("");
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      window.setTimeout(() => primaryRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    if (!date) {
      setError(t("validation.required", "Field is required"));
      return;
    }
    if (!time) {
      setError(t("booking.select_time", "Select Time"));
      return;
    }
    setLoading(true);
    try {
      const { response, data } = await bookingApi.create({
        course_id: course.id,
        date,
        time,
        duration_minutes: Number(duration),
        timezone: getUserTimezone(),
      });
      if (response.ok) {
        toast.success(t("booking.booking_created", "Booking request sent!"));
        onSuccess?.(data);
        onClose();
      } else {
        const rec = data as Record<string, unknown> | null;
        const msg = (rec?.["error"] as string | undefined) ?? (rec?.["message"] as string | undefined);
        if (response.status === 409) setError(t("booking.slot_taken", "This slot is already taken"));
        else setError(msg || t("booking.error", "Failed to create booking"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t("errors.network", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="booking-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t("booking.title", "Book a Lesson")}
    >
      <div className="booking-modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="booking-modal-title">{t("booking.title", "Book a Lesson")}</h2>

        {course.title && (
          <p className="booking-modal-course">
            <strong>{course.title}</strong>
            {course.teacher_name ? ` — ${course.teacher_name}` : ""}
          </p>
        )}

        <form onSubmit={handleSubmit} className="booking-modal-form">
          <label className="booking-modal-label" htmlFor="booking-date">
            {t("booking.select_date", "Select Date")}
          </label>
          <CalendarPicker
            value={date}
            minDate={todayStr}
            onSelect={(d) => {
              setDate(d);
              setTime("");
            }}
            ariaLabel={t("booking.select_date", "Select Date")}
          />

          <span className="booking-modal-label">{t("booking.select_time", "Select Time")}</span>
          <SlotPicker
            date={date ? new Date(`${date}T00:00:00`) : null}
            availability={availability}
            selected={time}
            onSelect={setTime}
            disabled={loading}
          />

          <label className="booking-modal-label" htmlFor="booking-duration">
            {t("booking.duration", "Duration (minutes)")}
          </label>
          <select
            id="booking-duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={loading}
          >
            <option value={30}>{t("booking.duration_options.30", "30 minutes")}</option>
            <option value={60}>{t("booking.duration_options.60", "1 hour")}</option>
            <option value={90}>{t("booking.duration_options.90", "1.5 hours")}</option>
            <option value={120}>{t("booking.duration_options.120", "2 hours")}</option>
          </select>

          {error && <div className="booking-modal-error" role="alert">{error}</div>}

          <div className="booking-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t("booking.cancel", "Cancel")}
            </button>
            <button ref={primaryRef} type="submit" className="btn-primary" disabled={loading}>
              {loading ? t("common.loading", "Loading...") : t("booking.book_now", "Book Now")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;

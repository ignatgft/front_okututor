import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { tutorsApi } from "../api/tutors.api";
import { enrollmentsApi } from "../api/students.api";
import { useToast } from "./ui/Toast";
import SlotPicker from "./booking/SlotPicker";
import "../styles/ScheduleModal.css";

export default function ScheduleModal({ enrollment, onClose, onSuccess }) {
  const { t } = useTranslation();
  const toast = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [availability, setAvailability] = useState([]);
  const [availabilityError, setAvailabilityError] = useState("");

  const primaryBtnRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { response, data } = await tutorsApi.availability();
        if (active && response.ok) setAvailability(Array.isArray(data) ? data : data.content || []);
        else if (active && !response.ok) setAvailabilityError(t("errors.default", "Something went wrong"));
      } catch {
        if (active) setAvailabilityError(t("errors.default", "Something went wrong"));
      }
    })();
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = document.querySelectorAll(
          ".schedule-modal-box input, .schedule-modal-box select, .schedule-modal-box button:not([disabled])"
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    primaryBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!date) {
      setError(t("validation.required", "Field is required"));
      return;
    }
    if (!time) {
      setError(t("validation.required", "Field is required"));
      return;
    }
    if (!date || !time) {
      setError(t("validation.required", "Field is required"));
      return;
    }
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      setError(t("validation.required", "Field is required"));
      return;
    }
    const end = new Date(start.getTime() + Number(duration) * 60000);
    if (end.getTime() <= start.getTime()) {
      setError(t("validation.required", "Field is required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { response, data } = await enrollmentsApi.acceptAndSchedule(enrollment.id, {
        date,
        time,
        duration_minutes: Number(duration),
      });
      if (response.ok) {
        toast.success(t("success.action_completed", "Action completed"));
        onSuccess(data);
      } else {
        if (response.status === 409) {
          setError(t("schedule_modal.slot_taken", "This slot is already taken"));
        } else {
          setError(data?.error || data?.message || t("errors.default", "Something went wrong"));
        }
      }
    } catch (err) {
      setError(err.message || t("errors.network", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="schedule-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t("schedule_modal.title", "Schedule Lesson")}
    >
      <div className="schedule-modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="schedule-modal-title">{t("schedule_modal.title", "Schedule Lesson")}</h2>

        <div className="schedule-modal-info">
          <p><strong>{t("profile.full_name", "Name")}:</strong> {enrollment.student_name || enrollment.student?.full_name}</p>
          <p><strong>{t("cr_course.name", "Course")}:</strong> {enrollment.course_title || enrollment.course?.title}</p>
          {enrollment.preferred_schedule && (
            <p className="preferred">
              🕐 {t("schedule_modal.preferred", "Preferred")}: {enrollment.preferred_schedule}
            </p>
          )}
          {enrollment.message && (
            <p className="message">
              «{enrollment.message}»
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="schedule-modal-form">
          <div className="schedule-modal-field">
            <label>{t("schedule_modal.date", "Date")}</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => { setDate(e.target.value); setTime(""); }}
              required
            />
          </div>

          <div className="schedule-modal-field">
            <label>{t("schedule_modal.time", "Time")}</label>
            {availabilityError ? (
              <p className="schedule-modal-hint">{availabilityError}</p>
            ) : (
              <SlotPicker
                date={date ? new Date(`${date}T00:00:00`) : null}
                availability={availability}
                selected={time}
                onSelect={setTime}
                disabled={loading}
              />
            )}
          </div>

          <div className="schedule-modal-field">
            <label>{t("schedule_modal.duration", "Duration")}</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={30}>{t("booking.duration_options.30", "30 minutes")}</option>
              <option value={45}>45 {t("schedule.minutes_short", "min")}</option>
              <option value={60}>{t("booking.duration_options.60", "1 hour")}</option>
              <option value={90}>{t("booking.duration_options.90", "1.5 hours")}</option>
              <option value={120}>{t("booking.duration_options.120", "2 hours")}</option>
            </select>
          </div>

          {error && <div className="schedule-modal-error">{error}</div>}

          <div className="schedule-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t("schedule_modal.cancel", "Cancel")}
            </button>
            <button
              ref={primaryBtnRef}
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t("common.loading", "Loading...") : t("schedule_modal.submit", "Confirm and Schedule")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

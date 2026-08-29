import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../api/booking.api";
import { BOOKING_STATUS } from "../../constants/enums";
import { isJoinable } from "../../api/calendar.api";
import { formatTime, formatDurationMin } from "../../utils/calendar";
import { useToast } from "../ui/Toast";
import "../../styles/CalendarEventModal.css";

export default function CalendarEventModal({ event, isOpen, onClose, onChanged, tutorMode = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const closeRef = useRef(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmCancel(false);
      return undefined;
    }
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const start = event.start_at ? new Date(event.start_at) : null;
  const end = event.end_at ? new Date(event.end_at) : null;
  const joinable = isJoinable(event);
  const canCancel =
    (event.status === BOOKING_STATUS.PENDING || event.status === BOOKING_STATUS.CONFIRMED) &&
    !tutorMode;
  const canReschedule = event.status === BOOKING_STATUS.CONFIRMED && !tutorMode && false;

  const handleJoin = () => {
    navigate(`/lesson/${event.id}`);
    onClose();
  };

  const openConfirm = () => setConfirmCancel(true);

  const handleCancel = async () => {
    setBusy(true);
    try {
      await bookingApi.cancel(event.id);
      toast.success(t("calendar.cancelled", "Booking cancelled"));
      setConfirmCancel(false);
      onClose();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || t("errors.default", "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ce-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Lesson details">
      <div className="ce-box" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="ce-close" onClick={onClose} aria-label={t("common.close", "Close")}>
          ✕
        </button>

        {confirmCancel ? (
          <div className="ce-confirm">
            <h3>{t("calendar.cancel_title", "Cancel this lesson?")}</h3>
            <p>{t("calendar.cancel_message", "Your booking request will be withdrawn.")}</p>
            <div className="ce-confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmCancel(false)} disabled={busy}>
                {t("common.back", "Back")}
              </button>
              <button type="button" className="btn-danger" onClick={handleCancel} disabled={busy}>
                {busy ? t("common.loading", "Loading...") : t("calendar.cancel_confirm", "Cancel booking")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className={`status-badge status-${String(event.status || "").toLowerCase()}`}>{event.status}</span>
            <h3 className="ce-title">{event.course_title || "—"}</h3>
            {event.teacher_name && <p className="ce-line">{t("course.tutor", "Tutor")}: {event.teacher_name}</p>}
            {event.student_name && <p className="ce-line">{t("calendar.student", "Student")}: {event.student_name}</p>}
            {event.location && <p className="ce-line">{t("calendar.location", "Place")}: {event.location}</p>}
            {start && (
              <p className="ce-line">
                {new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(start)}
                {" · "}
                {formatTime(start, i18n.language)}
                {end && <>–{formatTime(end, i18n.language)}</>}
                {end && <> ({formatDurationMin(start, end)} {t("calendar.min", "min")})</>}
              </p>
            )}
            <div className="ce-actions">
              {joinable && (
                <button type="button" className="btn-primary" onClick={handleJoin}>
                  {t("dashboard.join_lesson", "Join Lesson")}
                </button>
              )}
              {canCancel && !joinable && (
                <button type="button" className="btn-danger" onClick={openConfirm}>
                  {t("common.cancel", "Cancel")}
                </button>
              )}
              {canReschedule && (
                <button type="button" className="btn-secondary">
                  {t("calendar.reschedule", "Reschedule")}
                </button>
              )}
              {tutorMode && (
                <p className="ce-hint">{t("calendar.tutor_hint", "This is one of your lessons.")}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

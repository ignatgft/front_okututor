import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatInTimezone, formatTimeInTimezone, timezoneLabel } from "../../utils/timezone";
import { useJoinLesson, useCancelLesson, useRescheduleLesson, useReviewLesson } from "../../hooks/schedule";
import type { LessonDTO } from "../../types/schedule";
import { useToast } from "../../components/ui/Toast";
import "./LessonDetailsModal.css";

interface LessonDetailsModalProps {
  lesson: LessonDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export const LessonDetailsModal = function LessonDetailsModal({
  lesson,
  isOpen,
  onClose,
  onChanged,
}: LessonDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{ startAt: string; endAt: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const joinLesson = useJoinLesson();
  const cancelLesson = useCancelLesson();
  const rescheduleLesson = useRescheduleLesson();
  const reviewLesson = useReviewLesson();

  useEffect(() => {
    if (!isOpen) {
      setConfirmCancel(false);
      setRescheduleOpen(false);
      setRescheduleData(null);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !lesson) return null;

  const start = new Date(lesson.startAt);
  const end = new Date(lesson.endAt);
  const isInProgress = lesson.status === "IN_PROGRESS";
  const isCompleted = lesson.status === "COMPLETED";
  const isCancelled = lesson.status === "CANCELLED";
  const isUpcoming = lesson.status === "SCHEDULED" || lesson.status === "PENDING_CONFIRMATION";

  const dateStr = formatInTimezone(lesson.startAt, lesson.timezone, i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = `${formatTimeInTimezone(lesson.startAt, lesson.timezone, i18n.language)}–${formatTimeInTimezone(lesson.endAt, lesson.timezone, i18n.language)}`;
  const tzLabel = timezoneLabel(lesson.timezone);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);

  // Permissions from backend
  const canJoin = lesson.canJoin && (lesson.status === "SCHEDULED" || lesson.status === "IN_PROGRESS");
  const canCancel = lesson.canCancel && !isCompleted && !isCancelled;
  const canReschedule = lesson.canReschedule && !isCompleted && !isCancelled;
  const canReview = lesson.canReview && isCompleted;

  const handleJoin = () => {
    joinLesson.mutate(lesson.id, {
      onSuccess: () => onClose(),
    });
  };

  const openConfirmCancel = () => setConfirmCancel(true);

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelLesson.mutateAsync({ lessonId: lesson.id });
      onClose();
      onChanged?.();
    } catch {
      // Error handled in mutation
    } finally {
      setBusy(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData) return;
    setBusy(true);
    try {
      await rescheduleLesson.mutateAsync({
        lessonId: lesson.id,
        payload: {
          newStartAt: rescheduleData.startAt,
          newEndAt: rescheduleData.endAt,
          timezone: lesson.timezone,
        },
      });
      setRescheduleOpen(false);
      setRescheduleData(null);
      onClose();
      onChanged?.();
    } catch {
      // Error handled in mutation
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (rating: number, comment?: string) => {
    setBusy(true);
    try {
      await reviewLesson.mutateAsync({ lessonId: lesson.id, payload: { rating, comment } });
      onClose();
      onChanged?.();
    } catch {
      // Error handled in mutation
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lesson-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="lesson-modal-title">
      <div className="lesson-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          className="lesson-modal-close"
          onClick={onClose}
          aria-label={t("common.close", "Закрыть")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {confirmCancel ? (
          <div className="lesson-modal-confirm">
            <h3>{t("schedule.cancel_title", "Отменить это занятие?")}</h3>
            <p>{t("schedule.cancel_message", "Занятие будет отменено. Тьютор и ученик получат уведомление.")}</p>
            <div className="lesson-modal-confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmCancel(false)} disabled={busy}>
                {t("common.back", "Назад")}
              </button>
              <button type="button" className="btn-danger" onClick={handleCancel} disabled={busy}>
                {busy ? t("common.loading", "Загрузка...") : t("schedule.cancel_confirm", "Отменить занятие")}
              </button>
            </div>
          </div>
        ) : rescheduleOpen ? (
          <div className="lesson-modal-reschedule">
            <h3>{t("schedule.reschedule_title", "Перенести занятие")}</h3>
            <p>{t("schedule.reschedule_hint", "Выберите новую дату и время")}</p>
            <div className="reschedule-form">
              <div className="form-field">
                <label htmlFor="reschedule-date">{t("schedule.new_date", "Новая дата")}</label>
                <input
                  type="date"
                  id="reschedule-date"
                  value={rescheduleData?.startAt?.split("T")[0] || ""}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const prevTime = rescheduleData?.startAt?.split("T")[1] || "00:00:00";
                    setRescheduleData((prev) => ({
                      ...(prev || { startAt: lesson.startAt, endAt: lesson.endAt }),
                      startAt: `${newDate}T${prevTime}`,
                    }));
                  }}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="form-field">
                <label htmlFor="reschedule-time">{t("schedule.new_time", "Новое время")}</label>
                <input
                  type="time"
                  id="reschedule-time"
                  value={rescheduleData?.startAt?.split("T")[1]?.slice(0, 5) || ""}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    const prevDate = rescheduleData?.startAt?.split("T")[0] || new Date().toISOString().split("T")[0];
                    setRescheduleData((prev) => ({
                      ...(prev || { startAt: lesson.startAt, endAt: lesson.endAt }),
                      startAt: `${prevDate}T${newTime}:00`,
                      endAt: `${prevDate}T${newTime}:00`,
                    }));
                  }}
                />
              </div>
            </div>
            <div className="lesson-modal-confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setRescheduleOpen(false)} disabled={busy}>
                {t("common.cancel", "Отмена")}
              </button>
              <button type="button" className="btn-primary" onClick={handleReschedule} disabled={busy || !rescheduleData}>
                {busy ? t("common.loading", "Загрузка...") : t("schedule.reschedule_confirm", "Перенести")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="lesson-modal-header">
              <span className={`status-badge status-${lesson.status.toLowerCase().replace("_", "-")}`}>
                {t(`statuses.${lesson.status.toLowerCase().replace("_", "-")}`, lesson.status)}
              </span>
              {isInProgress && <span className="live-indicator" aria-live="polite">{t("schedule.live", "● ИДЁТ СЕЙЧАС")}</span>}
            </div>

            <h3 id="lesson-modal-title" className="lesson-modal-title">{lesson.courseTitle}</h3>

            <div className="lesson-modal-meta">
              <div className="lesson-modal-meta-row">
                <span className="meta-icon" aria-hidden="true">👤</span>
                <span className="meta-label">{t("schedule.tutor", "Тьютор")}:</span>
                <span className="meta-value">
                  <span className="tutor-avatar" aria-hidden="true">
                    {lesson.tutorAvatar ? <img src={lesson.tutorAvatar} alt="" /> : lesson.tutorName?.charAt(0).toUpperCase()}
                  </span>
                  {lesson.tutorName}
                </span>
              </div>

              <div className="lesson-modal-meta-row">
                <span className="meta-icon" aria-hidden="true">📅</span>
                <span className="meta-label">{t("schedule.date", "Дата")}:</span>
                <span className="meta-value">{dateStr}</span>
              </div>

              <div className="lesson-modal-meta-row">
                <span className="meta-icon" aria-hidden="true">🕐</span>
                <span className="meta-label">{t("schedule.time", "Время")}:</span>
                <span className="meta-value">{timeStr} ({duration} {t("schedule.min", "мин")})</span>
              </div>

              <div className="lesson-modal-meta-row">
                <span className="meta-icon" aria-hidden="true">🌍</span>
                <span className="meta-label">{t("schedule.timezone", "Часовой пояс")}:</span>
                <span className="meta-value">{tzLabel}</span>
              </div>

              <div className="lesson-modal-meta-row">
                <span className="meta-icon" aria-hidden="true">{lesson.format === "ONLINE" ? "💻" : "📍"}</span>
                <span className="meta-label">{t("schedule.format", "Формат")}:</span>
                <span className="meta-value">
                  {lesson.format === "ONLINE" ? t("schedule.online", "Онлайн") : t("schedule.offline", "Офлайн")}
                  {lesson.location && ` — ${lesson.location}`}
                </span>
              </div>
            </div>

            <div className="lesson-modal-actions">
              {canJoin && (
                <button
                  type="button"
                  className="btn-primary lesson-modal-join"
                  onClick={handleJoin}
                  disabled={joinLesson.isPending}
                >
                  {joinLesson.isPending ? t("common.loading", "Загрузка...") : t("schedule.join_lesson", "Войти в урок")}
                </button>
              )}

              {canReschedule && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRescheduleOpen(true)}
                  disabled={busy}
                >
                  {t("schedule.reschedule", "Перенести")}
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={openConfirmCancel}
                  disabled={busy}
                >
                  {t("common.cancel", "Отменить")}
                </button>
              )}

              {canReview && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    // Open review modal - simplified for now
                    const rating = prompt(t("review.rating_prompt", "Оцените урок от 1 до 5:"));
                    if (rating) handleReview(parseInt(rating));
                  }}
                  disabled={busy}
                >
                  {t("schedule.review", "Оставить отзыв")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

LessonDetailsModal.displayName = "LessonDetailsModal";
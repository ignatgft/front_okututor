import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatInTimezone, formatTimeInTimezone, timezoneLabel } from "../../utils/timezone";
import { useCountdown } from "../../hooks/schedule/useCountdown";
import type { LessonDTO } from "../../types/schedule";
import "./NextLessonCard.css";

interface NextLessonCardProps {
  lesson: LessonDTO | null;
  onJoin?: (lessonId: string) => void;
  onViewDetails?: (lesson: LessonDTO) => void;
}

export const NextLessonCard = memo(function NextLessonCard({ lesson, onJoin, onViewDetails }: NextLessonCardProps) {
  const { t } = useTranslation();
  const countdown = useCountdown(lesson?.startAt || null);
  const canJoin = (() => {
    if (!lesson?.canJoin) return false;
    if (lesson.status === "IN_PROGRESS") return true;
    if (lesson.status === "SCHEDULED") return countdown.isSoon && !countdown.isPast;
    return false;
  })();
  const isInProgress = lesson?.status === "IN_PROGRESS";

  if (!lesson) {
    return (
      <div className="next-lesson-card empty">
        <div className="next-lesson-icon" aria-hidden="true">📅</div>
        <h3>{t("schedule.next_lesson_empty_title", "Нет ближайших занятий")}</h3>
        <p>{t("schedule.next_lesson_empty_hint", "Когда будет назначен следующий урок, он появится здесь.")}</p>
        <Link to="/student/search" className="btn-primary next-lesson-cta">
          {t("schedule.find_tutor", "Найти тьютора")}
        </Link>
      </div>
    );
  }

  const dateStr = lesson.startAt ? formatInTimezone(lesson.startAt, lesson.timezone || "UTC", "ru", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : "—";
  const timeStr = lesson.startAt && lesson.endAt
    ? `${formatTimeInTimezone(lesson.startAt, lesson.timezone || "UTC")}–${formatTimeInTimezone(lesson.endAt, lesson.timezone || "UTC")}`
    : lesson.startAt ? formatTimeInTimezone(lesson.startAt, lesson.timezone || "UTC") : "—";
  const tzLabel = timezoneLabel(lesson.timezone || "UTC");

  // Format countdown — используем готовые ключи с интерполяцией
  let countdownText = "";
  if (countdown.isPast) {
    countdownText = isInProgress ? t("schedule.lesson_in_progress", "Идёт сейчас") : t("schedule.lesson_ended", "Урок завершился");
  } else if (countdown.days > 0) {
    countdownText = t("schedule.countdown_days", "{{days}} д {{hours}} ч", { days: countdown.days, hours: countdown.hours } as unknown as Record<string, unknown>).replace("{{days}}", String(countdown.days)).replace("{{hours}}", String(countdown.hours));
    // fallback если ключ не найден — ручная сборка
    if (countdownText.includes("{{")) countdownText = `${countdown.days} д ${countdown.hours} ч`;
  } else if (countdown.hours > 0) {
    countdownText = t("schedule.countdown_hours", "{{hours}} ч {{minutes}} мин", { hours: countdown.hours, minutes: countdown.minutes } as unknown as Record<string, unknown>);
    if (countdownText.includes("{{")) countdownText = `${countdown.hours} ч ${countdown.minutes} мин`;
  } else {
    countdownText = t("schedule.countdown_minutes", "{{minutes}} мин", { minutes: countdown.minutes } as unknown as Record<string, unknown>);
    if (countdownText.includes("{{")) countdownText = `${countdown.minutes} мин`;
  }

  const statusClass = `status-${String(lesson.status || "").toLowerCase().replace("_", "-") || "scheduled"}`;

  return (
    <div className={`next-lesson-card ${statusClass} ${isInProgress ? "in-progress" : ""}`}>
      <div className="next-lesson-header">
        <span className="next-lesson-label">{t("schedule.next_lesson", "Следующий урок")}</span>
        {isInProgress && <span className="live-badge" aria-live="polite">{t("schedule.live", "● ИДЁТ СЕЙЧАС")}</span>}
      </div>

      <div className="next-lesson-content">
        <div className="next-lesson-main">
          <h3 className="next-lesson-title">{lesson.courseTitle}</h3>
          <div className="next-lesson-meta">
            <span className="next-lesson-tutor">
              <span className="tutor-avatar" aria-hidden="true">
                {lesson.tutorAvatar ? (
                  <img src={lesson.tutorAvatar} alt="" />
                ) : (
                  lesson.tutorName?.charAt(0).toUpperCase() || "?"
                )}
              </span>
              {lesson.tutorName}
            </span>
          </div>
        </div>

        <div className="next-lesson-details">
          <div className="next-lesson-detail">
            <span className="detail-icon" aria-hidden="true">📅</span>
            <span>{dateStr}</span>
          </div>
          <div className="next-lesson-detail">
            <span className="detail-icon" aria-hidden="true">🕐</span>
            <span>{timeStr}</span>
          </div>
          <div className="next-lesson-detail">
            <span className="detail-icon" aria-hidden="true">🌍</span>
            <span>{tzLabel}</span>
          </div>
          <div className="next-lesson-countdown" aria-live="polite" aria-atomic="true">
            <span className="countdown-label">{t("schedule.starts_in", "Начнётся через")}</span>
            <span className="countdown-value">{countdownText}</span>
          </div>
        </div>
      </div>

      <div className="next-lesson-actions">
        <button
          type="button"
          className={`btn-primary next-lesson-join ${canJoin ? "" : "disabled"}`}
          onClick={() => onJoin?.(lesson.id)}
          disabled={!canJoin}
          aria-disabled={!canJoin}
        >
          {isInProgress
            ? t("schedule.join_lesson", "Войти в урок")
            : countdown.isSoon
            ? t("schedule.join_soon", "Скоро можно войти")
            : t("schedule.join_lesson", "Войти в урок")}
        </button>
        <button
          type="button"
          className="btn-secondary next-lesson-details"
          onClick={() => onViewDetails?.(lesson)}
        >
          {t("schedule.details", "Детали")}
        </button>
      </div>
    </div>
  );
});

NextLessonCard.displayName = "NextLessonCard";
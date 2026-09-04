import { memo } from "react";
import { useTranslation } from "react-i18next";
import { formatTimeInTimezone, formatInTimezone } from "../../utils/timezone";
import type { LessonDTO, LessonMinimal } from "../../types/schedule";
import "./LessonCard.css";

interface LessonCardProps {
  lesson: LessonDTO | LessonMinimal;
  onClick?: (lesson: LessonDTO | LessonMinimal) => void;
  onJoin?: (lesson: LessonDTO | LessonMinimal) => void;
  compact?: boolean;
  showDate?: boolean;
  showJoin?: boolean;
}

export const LessonCard = memo(function LessonCard({
  lesson,
  onClick,
  onJoin,
  compact = false,
  showDate = false,
  showJoin = false,
}: LessonCardProps) {
  const { t } = useTranslation();
  const isLessonDTO = "courseId" in lesson && "tutorId" in lesson;
  const canJoin = (() => {
    if (!isLessonDTO || !lesson.canJoin) return false;
    if (lesson.status === "IN_PROGRESS") return true;
    if (lesson.status !== "SCHEDULED") return false;
    // Online upcoming lesson — 10 min window before start (требование)
    // For OFFLINE we keep same window for consistency; backend canJoin already false for offline without meeting
    const start = new Date(lesson.startAt).getTime();
    const diff = start - Date.now();
    return diff < 10 * 60 * 1000 && diff > -30 * 60 * 1000;
  })();
  const isInProgress = lesson.status === "IN_PROGRESS";

  const timeStr = `${formatTimeInTimezone(lesson.startAt, lesson.timezone)}–${formatTimeInTimezone(lesson.endAt, lesson.timezone)}`;
  const dateStr = formatInTimezone(lesson.startAt, lesson.timezone, "ru", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const statusClass = `status-${String(lesson.status || "").toLowerCase().replace("_", "-") || "scheduled"}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(lesson);
    }
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(lesson);
  };

  if (compact) {
    return (
      <button
        type="button"
        className={`lesson-card compact ${statusClass}`}
        onClick={handleClick}
        aria-label={`${lesson.courseTitle} ${timeStr}`}
      >
        <span className="lesson-card-time">{timeStr}</span>
        <span className="lesson-card-title">{lesson.courseTitle}</span>
        {showJoin && canJoin && (
          <span className="lesson-card-join">{t("schedule.join", "Войти")}</span>
        )}
      </button>
    );
  }

  return (
    <article className={`lesson-card ${statusClass}`} onClick={handleClick}>
      <div className="lesson-card-time">
        <span className="lesson-card-time-main">{timeStr}</span>
        {showDate && <span className="lesson-card-date">{dateStr}</span>}
        {isInProgress && <span className="lesson-card-live" aria-live="polite">{t("schedule.live", "● ИДЁТ")}</span>}
      </div>

      <div className="lesson-card-content">
        <h4 className="lesson-card-title">{lesson.courseTitle}</h4>
        {(isLessonDTO && lesson.tutorName) || (!isLessonDTO && "tutorName" in lesson && lesson.tutorName) ? (
          <p className="lesson-card-tutor">
            <span className="tutor-avatar" aria-hidden="true">
              {isLessonDTO && lesson.tutorAvatar ? (
                <img src={lesson.tutorAvatar} alt="" />
              ) : (
                (isLessonDTO ? lesson.tutorName : "tutorName" in lesson ? lesson.tutorName : "")?.charAt(0).toUpperCase() || "?"
              )}
            </span>
            {isLessonDTO ? lesson.tutorName : "tutorName" in lesson ? lesson.tutorName : ""}
          </p>
        ) : (
          <p className="lesson-card-tutor">
            <span className="tutor-avatar" aria-hidden="true">?</span>
            {t("schedule.unknown_tutor", "Тьютор")}
          </p>
        )}

        {isLessonDTO && lesson.format && (
          <span className={`lesson-card-format format-${String(lesson.format || "").toLowerCase()}`}>
            {String(lesson.format).toUpperCase() === "ONLINE" ? t("schedule.online", "Онлайн") : t("schedule.offline", "Офлайн")}
          </span>
        )}
      </div>

      <div className="lesson-card-actions">
        <span className={`status-badge ${statusClass}`}>{t(`statuses.${String(lesson.status || "").toLowerCase().replace("_", "-")}`, String(lesson.status || "SCHEDULED"))}</span>
        {showJoin && canJoin && (
          <button
            type="button"
            className="btn-primary lesson-card-join-btn"
            onClick={handleJoin}
            aria-label={t("schedule.join_lesson", "Войти в урок")}
          >
            {isInProgress ? t("schedule.join_lesson", "Войти") : t("schedule.join_soon", "Войти")}
          </button>
        )}
      </div>
    </article>
  );
});

LessonCard.displayName = "LessonCard";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatInTimezone, formatTimeInTimezone } from "../../utils/timezone";
import { LessonCard } from "./LessonCard";
import { ScheduleSkeleton } from "./ScheduleSkeleton";
import type { LessonDTO, DayScheduleResponse } from "../../types/schedule";
import "./DayView.css";

interface DayViewProps {
  date: string;
  data: DayScheduleResponse | undefined;
  loading: boolean;
  error: Error | null;
  onLessonClick: (lesson: LessonDTO) => void;
  onJoinLesson: (lesson: LessonDTO) => void;
  locale?: string;
}

export const DayView = memo(function DayView({
  date,
  data,
  loading,
  error,
  onLessonClick,
  onJoinLesson,
  locale = "ru",
}: DayViewProps) {
  const { t } = useTranslation();

  const dayDate = useMemo(() => new Date(date + "T00:00:00"), [date]);
  const dateLabel = useMemo(
    () => dayDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    [dayDate, locale]
  );

  const lessons = useMemo(() => data?.lessons || [], [data]);

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [lessons]
  );

  if (loading) {
    return <ScheduleSkeleton compact={false} count={4} />;
  }

  if (error) {
    return (
      <div className="day-view-error" role="alert">
        <p>{t("schedule.load_error", "Не удалось загрузить расписание")}</p>
        <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
          {t("common.retry", "Повторить")}
        </button>
      </div>
    );
  }

  if (!sortedLessons.length) {
    return (
      <div className="day-view-empty" role="status">
        <span className="empty-icon" aria-hidden="true">📅</span>
        <h3>{t("schedule.empty_day", "Сегодня занятий нет")}</h3>
        <p>{t("schedule.empty_day_hint", "Наслаждайтесь свободным днём или найдите нового тьютора")}</p>
      </div>
    );
  }

  return (
    <section className="day-view" aria-labelledby="day-view-title">
      <header className="day-view-header">
        <h2 id="day-view-title" className="day-view-title">{dateLabel}</h2>
        <span className="day-view-count" aria-label={`${sortedLessons.length} занятий`}>
          {sortedLessons.length} {t("plural.lesson_count", "занятий")}
        </span>
      </header>

      <div className="day-view-timeline" role="list" aria-label={t("schedule.lessons_today", "Занятия на сегодня")}>
        {sortedLessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onClick={onLessonClick}
            onJoin={onJoinLesson}
            showDate={false}
          />
        ))}
      </div>
    </section>
  );
});

DayView.displayName = "DayView";
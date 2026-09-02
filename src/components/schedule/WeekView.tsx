import { memo, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { startOfWeek, addDays, isToday, isSameDay, formatInTimezone, formatTimeInTimezone } from "../../utils/calendar";
import { LessonCard } from "./LessonCard";
import { ScheduleSkeleton } from "./ScheduleSkeleton";
import type { LessonDTO, WeekScheduleResponse } from "../../types/schedule";
import "./WeekView.css";

interface WeekViewProps {
  weekStart: string;
  data: WeekScheduleResponse | undefined;
  loading: boolean;
  error: Error | null;
  selectedDate: string;
  onLessonClick: (lesson: LessonDTO) => void;
  onJoinLesson: (lesson: LessonDTO) => void;
  onDateSelect: (date: string) => void;
  locale?: string;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_KEYS = {
  monday: "days.monday",
  tuesday: "days.tuesday",
  wednesday: "days.wednesday",
  thursday: "days.thursday",
  friday: "days.friday",
  saturday: "days.saturday",
  sunday: "days.sunday",
};

export const WeekView = memo(function WeekView({
  weekStart,
  data,
  loading,
  error,
  selectedDate,
  onLessonClick,
  onJoinLesson,
  onDateSelect,
  locale = "ru",
}: WeekViewProps) {
  const { t } = useTranslation();

  const weekStartDate = useMemo(() => new Date(weekStart + "T00:00:00"), [weekStart]);
  const days = useMemo(() => DAYS.map((_, i) => addDays(weekStartDate, i)), [weekStartDate]);
  const selectedDateObj = useMemo(() => new Date(selectedDate + "T00:00:00"), [selectedDate]);

  const dayLessonsMap = useMemo(() => {
    const map = new Map<string, LessonDTO[]>();
    data?.days.forEach((day) => {
      map.set(day.date, day.lessons);
    });
    return map;
  }, [data]);

  const sortedDayLessons = useMemo(() => {
    const result = new Map<string, LessonDTO[]>();
    dayLessonsMap.forEach((lessons, date) => {
      result.set(date, [...lessons].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    });
    return result;
  }, [dayLessonsMap]);

  if (loading) {
    return <ScheduleSkeleton compact={false} count={7} />;
  }

  if (error) {
    return (
      <div className="week-view-error" role="alert">
        <p>{t("schedule.load_error", "Не удалось загрузить неделю")}</p>
        <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
          {t("common.retry", "Повторить")}
        </button>
      </div>
    );
  }

  const hasAnyLessons = data?.days.some((d) => d.lessons.length > 0) ?? false;

  return (
    <section className="week-view" aria-labelledby="week-view-title">
      <header className="week-view-header">
        <h2 id="week-view-title" className="week-view-title">
          {t("schedule.week_of", "Неделя с {{date}}", { date: weekStartDate.toLocaleDateString(locale, { day: "numeric", month: "long" }) })}
        </h2>
      </header>

      <div className="week-view-grid" role="grid" aria-label={t("schedule.week_grid", "Неделя")}>
        {/* Weekday headers */}
        <div className="week-view-weekdays" role="row">
          {DAYS.map((day, i) => (
            <div key={day} className="week-view-weekday" role="columnheader">
              <span className="week-view-weekday-name">
                {t(DAY_KEYS[day as keyof typeof DAY_KEYS], day.slice(0, 2).toUpperCase())}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="week-view-days" role="row">
          {days.map((day) => {
            const dateStr = day.toISOString().split("T")[0];
            const lessons = sortedDayLessons.get(dateStr) || [];
            const today = isToday(day);
            const selected = isSameDay(day, selectedDateObj);

            return (
              <div
                key={dateStr}
                className={`week-view-day ${today ? "today" : ""} ${selected ? "selected" : ""}`}
                role="gridcell"
                onClick={() => onDateSelect(dateStr)}
              >
                <button
                  type="button"
                  className="week-view-day-header"
                  onClick={(e) => { e.stopPropagation(); onDateSelect(dateStr); }}
                  aria-label={day.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                  aria-pressed={selected}
                >
                  <span className="week-view-day-name">{day.toLocaleDateString(locale, { weekday: "short" })}</span>
                  <span className="week-view-day-number">{day.getDate()}</span>
                  {today && <span className="week-view-today-badge" aria-label={t("schedule.today", "Сегодня")}>{t("schedule.today_short", "Сегодня")}</span>}
                </button>

                <div className="week-view-lessons" role="list" aria-label={`${lessons.length} занятий`}>
                  {lessons.length === 0 ? (
                    <span className="week-view-empty">—</span>
                  ) : (
                    lessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onClick={onLessonClick}
                        onJoin={onJoinLesson}
                        compact={true}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasAnyLessons && (
        <div className="week-view-empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">📅</span>
          <h3>{t("schedule.empty_week", "На этой неделе занятий нет")}</h3>
        </div>
      )}
    </section>
  );
});

WeekView.displayName = "WeekView";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { monthGridFor, isToday, isSameDay, formatInTimezone, eventDaysKey } from "../../utils/calendar";
import { LessonCard } from "./LessonCard";
import { ScheduleSkeleton } from "./ScheduleSkeleton";
import type { LessonDTO, MonthScheduleResponse } from "../../types/schedule";
import "./MonthView.css";

interface MonthViewProps {
  year: number;
  month: number; // 1-12
  data: MonthScheduleResponse | undefined;
  loading: boolean;
  error: Error | null;
  selectedDate: string;
  onLessonClick: (lesson: LessonDTO) => void;
  onJoinLesson: (lesson: LessonDTO) => void;
  onDateSelect: (date: string) => void;
  locale?: string;
}

const MONTH_NAMES = [
  "months.january", "months.february", "months.march", "months.april",
  "months.may", "months.june", "months.july", "months.august",
  "months.september", "months.october", "months.november", "months.december",
];

export const MonthView = memo(function MonthView({
  year,
  month,
  data,
  loading,
  error,
  selectedDate,
  onLessonClick,
  onJoinLesson,
  onDateSelect,
  locale = "ru",
}: MonthViewProps) {
  const { t } = useTranslation();

  const monthDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const selectedDateObj = useMemo(() => new Date(selectedDate + "T00:00:00"), [selectedDate]);
  const cells = useMemo(() => monthGridFor(monthDate), [monthDate]);

  // Build lesson map for quick lookup
  const lessonMap = useMemo(() => {
    const map = new Map<string, LessonDTO[]>();
    data?.days.forEach((day) => {
      if (day.lessons?.length) {
        map.set(day.date, day.lessons);
      }
    });
    return map;
  }, [data]);

  const monthLabel = useMemo(
    () => `${t(MONTH_NAMES[month - 1], monthDate.toLocaleDateString(locale, { month: "long" }))} ${year}`,
    [month, year, locale]
  );

  if (loading) {
    return <ScheduleSkeleton compact={true} />;
  }

  if (error) {
    return (
      <div className="month-view-error" role="alert">
        <p>{t("schedule.load_error", "Не удалось загрузить месяц")}</p>
        <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
          {t("common.retry", "Повторить")}
        </button>
      </div>
    );
  }

  const hasAnyLessons = data?.days.some((d) => d.hasLessons) ?? false;

  return (
    <section className="month-view" aria-labelledby="month-view-title">
      <header className="month-view-header">
        <h2 id="month-view-title" className="month-view-title">{monthLabel}</h2>
      </header>

      <div className="month-view-wrapper">
        {/* Weekday headers */}
        <div className="month-view-weekdays" role="row">
          {["days.monday", "days.tuesday", "days.wednesday", "days.thursday", "days.friday", "days.saturday", "days.sunday"].map((dayKey, i) => (
            <div key={i} className="month-view-weekday" role="columnheader">
              {t(dayKey, ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i])}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="month-view-grid" role="grid" aria-label={monthLabel}>
          {cells.map((cell, idx) => {
            if (!cell) {
              return <div key={idx} className="month-view-cell empty" aria-hidden="true" />;
            }

            const dateStr = cell.toISOString().split("T")[0];
            const dayLessons = lessonMap.get(dateStr) || [];
            const lessonCount = data?.days.find((d) => d.date === dateStr)?.lessonCount ?? dayLessons.length;
            const hasLessons = lessonCount > 0;
            const today = isToday(cell);
            const selected = isSameDay(cell, selectedDateObj);

            return (
              <button
                key={idx}
                type="button"
                role="gridcell"
                className={`month-view-cell ${today ? "today" : ""} ${selected ? "selected" : ""} ${hasLessons ? "has-lessons" : ""}`}
                onClick={() => onDateSelect(dateStr)}
                aria-label={cell.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                aria-selected={selected}
                disabled={false}
              >
                <span className="month-view-day-number">{cell.getDate()}</span>

                {hasLessons && (
                  <div className="month-view-lessons" role="list" aria-label={`${lessonCount} ${t("plural.lesson", "занятий")}`}>
                    {dayLessons.slice(0, 2).map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onClick={onLessonClick}
                        onJoin={onJoinLesson}
                        compact={true}
                      />
                    ))}
                    {lessonCount > 2 && (
                      <span className="month-view-more" aria-label={`${lessonCount - 2} more`}>
                        +{lessonCount - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!hasAnyLessons && (
        <div className="month-view-empty-state" role="status">
          <span className="empty-icon" aria-hidden="true">📅</span>
          <h3>{t("schedule.empty_month", "В этом месяце занятий нет")}</h3>
        </div>
      )}
    </section>
  );
});

MonthView.displayName = "MonthView";
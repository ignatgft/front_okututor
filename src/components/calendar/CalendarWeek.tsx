import { memo, useMemo } from "react";
import { weekDaysFor, eventDaysKey, isToday } from "../../utils/calendar";
import CalendarEventCard from "./CalendarEventCard";
import type { BookingDTO } from "../../types/api";

export interface CalendarWeekProps {
  weekStart: Date | string;
  eventsByDay: Record<string, BookingDTO[]>;
  onSelectEvent: (evt: BookingDTO) => void;
  onSelectDay: (day: Date) => void;
  locale?: string;
}

function CalendarWeek({ weekStart, eventsByDay, onSelectEvent, onSelectDay, locale = "ru" }: CalendarWeekProps): JSX.Element {
  const startDate = useMemo(() => (weekStart instanceof Date ? weekStart : new Date(weekStart as string)), [weekStart]);
  const days = useMemo(() => weekDaysFor(startDate), [startDate]);
  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    });
  }, [locale]);

  return (
    <div className="calendar-week">
      {days.map((day, i) => {
        const key = eventDaysKey(day);
        const events = eventsByDay[key] || [];
        const today = isToday(day);
        return (
          <div key={key} className={`calendar-week-col ${today ? "is-today" : ""}`}>
            <button
              type="button"
              className="calendar-week-dayhead"
              onClick={() => onSelectDay(day)}
              aria-label={new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(day)}
            >
              <span className="calendar-week-weekday">{weekdayNames[i]}</span>
              <span className="calendar-week-daynum">{day.getDate()}</span>
            </button>
            <div className="calendar-week-events">
              {events
                .slice()
                .sort((a, b) => new Date(a.start_at as string).getTime() - new Date(b.start_at as string).getTime())
                .map((evt) => (
                  <CalendarEventCard key={String(evt.id)} event={evt} onClick={() => onSelectEvent(evt)} locale={locale} />
                ))}
              {events.length === 0 && <span className="calendar-week-empty">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(CalendarWeek);

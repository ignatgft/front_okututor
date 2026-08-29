import { memo, useMemo } from "react";
import { weekDaysFor, eventDaysKey, isToday } from "../../utils/calendar";
import CalendarEventCard from "./CalendarEventCard";

function CalendarWeek({ weekStart, eventsByDay, onSelectEvent, onSelectDay, locale = "ru" }) {
  const days = useMemo(() => weekDaysFor(weekStart), [weekStart]);
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
                .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                .map((evt) => (
                  <CalendarEventCard key={evt.id} event={evt} onClick={() => onSelectEvent(evt)} locale={locale} />
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

import { memo, useMemo } from "react";
import { monthGridFor, eventDaysKey, isSameDay, isToday } from "../../utils/calendar";

function CalendarMonth({ month, eventsByDay, selectedDay, onSelectDay, locale = "ru" }) {
  const cells = useMemo(() => monthGridFor(month), [month]);
  const weekdayNames = useMemo(() => {
    const base = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    });
  }, [locale]);

  return (
    <div className="calendar-month-wrap">
      <div className="calendar-month-weekdays" role="row">
        {weekdayNames.map((n, i) => (
          <span key={i} className="calendar-month-weekday">{n}</span>
        ))}
      </div>
      <div className="calendar-month-grid" role="grid">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={idx} className="calendar-month-cell calendar-month-cell-empty" aria-hidden="true" />;
          }
          const key = eventDaysKey(cell);
          const events = eventsByDay[key] || [];
          const selected = selectedDay && isSameDay(cell, selectedDay);
          const today = isToday(cell);
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              className={`calendar-month-cell ${today ? "is-today" : ""} ${selected ? "is-selected" : ""}`}
              onClick={() => onSelectDay(cell)}
              aria-label={new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(cell)}
            >
              <span className="calendar-month-daynum">{cell.getDate()}</span>
              <div className="calendar-month-events">
                {events.slice(0, 2).map((evt) => (
                  <span key={evt.id} className={`calendar-month-dot dot-${String(evt.status || "").toLowerCase()}`} />
                ))}
                {events.length > 2 && <span className="calendar-month-more">+{events.length - 2}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(CalendarMonth);

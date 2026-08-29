import { memo, useMemo } from "react";
import { formatTime, formatDurationMin } from "../../utils/calendar";
import { isJoinable } from "../../api/calendar.api";

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 22;
const HOUR_ROW_PX = 60;

function CalendarDay({ day, events, onSelectEvent, onJoin, locale = "ru" }) {
  const dayStart = useMemo(() => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [day]);

  const dayEvents = useMemo(() => {
    return events
      .filter((evt) => evt.start_at && evt.end_at)
      .map((evt) => {
        const s = new Date(evt.start_at);
        const e = new Date(evt.end_at);
        const minutesFromMidnight = s.getHours() * 60 + s.getMinutes();
        const top = Math.max(0, ((minutesFromMidnight - GRID_START_HOUR * 60) / 60) * HOUR_ROW_PX);
        const dur = formatDurationMin(s, e);
        const height = Math.max(28, (dur / 60) * HOUR_ROW_PX);
        return { ...evt, _top: top, _height: height, _start: s, _end: e };
      })
      .sort((a, b) => a._start - b._start);
  }, [events]);

  const hours = useMemo(() => {
    const arr = [];
    for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  return (
    <div className="calendar-day">
      <div className="calendar-day-grid" style={{ height: (GRID_END_HOUR - GRID_START_HOUR) * HOUR_ROW_PX }}>
        {hours.map((h) => (
          <div
            key={h}
            className="calendar-day-hour"
            style={{ top: (h - GRID_START_HOUR) * HOUR_ROW_PX }}
          >
            <span className="calendar-day-hourlabel">{h}:00</span>
          </div>
        ))}
        <div className="calendar-day-events">
          {dayEvents.map((evt) => (
            <button
              key={evt.id}
              type="button"
              className={`calendar-day-event event-${String(evt.status || "").toLowerCase()}`}
              style={{ top: evt._top, height: evt._height }}
              onClick={() => onSelectEvent(evt)}
              aria-label={`${evt.course_title || ""} ${formatTime(evt._start, locale)}`}
            >
              <span className="calendar-day-event-title">{evt.course_title || "—"}</span>
              <span className="calendar-day-event-time">
                {formatTime(evt._start, locale)}–{formatTime(evt._end, locale)}
              </span>
              {isJoinable(evt) && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="calendar-day-event-join chip-join"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoin?.(evt);
                  }}
                >
                  join
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <p className="calendar-day-now">{new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(dayStart)}</p>
    </div>
  );
}

export default memo(CalendarDay);

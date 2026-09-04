/* eslint-disable react-refresh/only-export-components */
// migrated to TSX — minimal strict types (controlled)
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function toMinutesClock(t) {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t));
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function inRange(minute, start, end) {
  if (start == null || end == null) return false;
  return minute >= start && minute < end;
}

/**
 * Builds a weekly time grid from availability blocks.
 * Each availability entry: { weekday: "monday"|1..7, start_time, end_time, available?: boolean }
 * Returns { days: [{key, minute: 0}], hours: [{minute, label}], cellAt(dayIdx, minute) }
 */
export function buildCalendarGrid(availability = [], range = { start: 7 * 60, end: 20 * 60, step: 60 }) {
  const minutes = [];
  for (let m = range.start; m <= range.end; m += range.step) minutes.push(m);

  const normalizeDay = (wd) => {
    if (typeof wd === "number") return WEEKDAYS[(wd - 1 + 7) % 7];
    return String(wd || "").toLowerCase();
  };

  const layers = availability.map((a) => ({
    day: normalizeDay(a.weekday),
    start: toMinutesClock(a.start_time),
    end: toMinutesClock(a.end_time),
    available: a.available !== false,
  }));

  const cellAt = (dayKey, minute) => {
    const matches = layers.filter((l) => l.day === dayKey);
    if (!matches.length) return "none";
    const hit = matches.find((l) => inRange(minute, l.start, l.end));
    if (!hit) return "none";
    return hit.available ? "available" : "busy";
  };

  return {
    days: WEEKDAYS,
    minutes,
    normalizeDay,
    cellAt,
  };
}

export function CalendarWeekOverlay({ availability = [], range }: Record<string, unknown>) {
  const grid = buildCalendarGrid(availability, range);
  return (
    <div className="calendar-overlay" role="grid" aria-label="Weekly availability">
      <div className="calendar-overlay-row calendar-overlay-header">
        <span className="calendar-overlay-corner" />
        {grid.days.map((d) => (
          <span key={d} className="calendar-overlay-cell calendar-overlay-day">{d.slice(0, 3)}</span>
        ))}
      </div>
      {grid.minutes.map((minute) => (
        <div key={minute} className="calendar-overlay-row">
          <span className="calendar-overlay-corner">
            {`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`}
          </span>
          {grid.days.map((d) => {
            const state = grid.cellAt(d, minute);
            return (
              <span
                key={d}
                className={`calendar-overlay-cell calendar-overlay-${state}`}
                role="gridcell"
                data-state={state}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

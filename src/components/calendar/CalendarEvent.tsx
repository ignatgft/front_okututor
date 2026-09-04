import { memo } from "react";
import { useTranslation } from "react-i18next";
import { formatTime } from "../../utils/calendar";
import type { BookingDTO } from "../../types/api";

export interface CalendarEventProps {
  event: BookingDTO;
  compact?: boolean;
  showDate?: boolean;
  onClick?: () => void;
}

function CalendarEvent({ event, compact = false, showDate = false, onClick }: CalendarEventProps): JSX.Element {
  const { i18n } = useTranslation();
  const start = event.start_at ? new Date(event.start_at) : null;
  const cls = String(event.status || "").toLowerCase();

  return (
    <button
      type="button"
      className={`calendar-event event-${cls} ${compact ? "calendar-event-compact" : ""}`}
      onClick={onClick}
      aria-label={`${event.course_title || ""} ${start ? formatTime(start, i18n.language) : ""}`}
    >
      {start && (
        <span className="calendar-event-time">
          {showDate
            ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(start)
            : formatTime(start, i18n.language)}
        </span>
      )}
      <span className="calendar-event-title">{event.course_title || "—"}</span>
    </button>
  );
}

export default memo(CalendarEvent);

import { memo } from "react";
import { formatTime } from "../../utils/calendar";
import type { BookingDTO } from "../../types/api";

export interface CalendarEventCardProps {
  event: BookingDTO;
  compact?: boolean;
  onClick?: () => void;
  showDate?: boolean;
  locale?: string;
}

function CalendarEventCard({ event, compact = false, onClick, showDate = false, locale = "ru" }: CalendarEventCardProps): JSX.Element {
  const start = event.start_at ? new Date(event.start_at as string) : null;
  const cls = String(event.status || "").toLowerCase();

  return (
    <button
      type="button"
      className={`calendar-event event-${cls} ${compact ? "calendar-event-compact" : ""}`}
      onClick={onClick}
      aria-label={`${event.course_title || ""} ${start ? formatTime(start, locale) : ""}`}
    >
      {start && (
        <span className="calendar-event-time">
          {showDate
            ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(start)
            : formatTime(start, locale)}
        </span>
      )}
      <span className="calendar-event-title">{event.course_title || "—"}</span>
    </button>
  );
}

export default memo(CalendarEventCard);

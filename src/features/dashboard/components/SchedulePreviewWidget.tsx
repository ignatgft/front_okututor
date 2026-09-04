import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { BookingDTO } from "../../../types/api";

export interface SchedulePreviewWidgetProps {
  bookings: BookingDTO[];
}

export function SchedulePreviewWidget({ bookings }: SchedulePreviewWidgetProps): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const nextLessonsPreview = useMemo(() =>
    bookings
      .filter((b) => b.status === "CONFIRMED" && new Date(b.start_at as string) > new Date())
      .sort((a, b) => new Date(a.start_at as string).getTime() - new Date(b.start_at as string).getTime())
      .slice(0, 3),
    [bookings]);

  if (nextLessonsPreview.length === 0) return null;

  return (
    <div className="pending-section">
      <h2>{t("dashboard.schedule_preview", "Schedule")}</h2>
      <div className="bookings-list">
        {nextLessonsPreview.map((b) => (
          <button key={String(b.id)} type="button" className="booking-card schedule-preview-row" onClick={() => navigate(`/lesson/${b.id}`)}>
            <div className="booking-info">
              <h3>{b.course_title as string}</h3>
              <p className="booking-time">
                {new Date(b.start_at as string).toLocaleDateString(i18n.language, { day: "numeric", month: "long" })}
                {" · "}
                {new Date(b.start_at as string).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
            </div>
            <span className="btn-link">{t("dashboard.join_lesson", "Join")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

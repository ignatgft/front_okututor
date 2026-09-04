import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Spinner, Skeleton, EmptyState, ErrorState } from "../../../components/ui/Primitives";
import type { BookingDTO } from "../../../types/api";

export interface BookingHistoryWidgetProps {
  bookings: BookingDTO[];
  filter: string;
  onFilterChange: (f: string) => void;
  onCancel: (booking: BookingDTO) => void;
  onReview: (booking: BookingDTO) => void;
  reviewedIds: (string | number)[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function BookingHistoryWidget({ bookings, filter, onFilterChange, onCancel, onReview, reviewedIds, loading, error, onRetry }: BookingHistoryWidgetProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const canReview = (b: Record<string, unknown>): boolean =>
    b["status"] === "COMPLETED" && Boolean(b["course_id"]) && !reviewedIds.includes(b["id"] as string | number) && !b["has_review"];

  if (loading) {
    return (
      <>
        <div className="dashboard-tabs">
          {["upcoming", "past", "cancelled", "all"].map((f) => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => onFilterChange(f)}>
              {t(`dashboard.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Skeleton count={1} className="skeleton-card" />
        <Skeleton count={1} className="skeleton-card" />
        <Skeleton count={1} className="skeleton-card" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="dashboard-tabs">
          {["upcoming", "past", "cancelled", "all"].map((f) => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => onFilterChange(f)}>
              {t(`dashboard.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <ErrorState message={error} onRetry={onRetry} />
      </>
    );
  }

  if (bookings.length === 0) {
    return (
      <>
        <div className="dashboard-tabs">
          {["upcoming", "past", "cancelled", "all"].map((f) => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => onFilterChange(f)}>
              {t(`dashboard.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <EmptyState icon="📚" title={t("dashboard.no_bookings", "No bookings found") as string} hint={t("dashboard.find_tutors", "Find tutors and book a lesson.") as string} />
      </>
    );
  }

  return (
    <>
      <div className="dashboard-tabs">
        {["upcoming", "past", "cancelled", "all"].map((f) => (
          <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => onFilterChange(f)}>
            {t(`dashboard.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bookings-list">
        {bookings.map((b) => {
          const rec = b as unknown as Record<string, unknown>;
          return (
          <div key={String(b.id)} className="booking-card">
            <div className="booking-info">
              <h3>{b.course_title as string}</h3>
              <p>{b.teacher_name as string}</p>
              <p className="booking-time">
                {new Date(b.start_at as string).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" })}
                {new Date(b.start_at as string).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {new Date(b.end_at as string).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
              </p>
              <span className={`status-badge status-${String(b.status ?? "").toLowerCase()}`}>{b.status}</span>
            </div>
            <div className="booking-actions">
              {b.status === "CONFIRMED" && (
                <button className="btn-primary" onClick={() => navigate(`/lesson/${b.id}`)}>
                  {t("dashboard.join_lesson") || "Join Lesson"}
                </button>
              )}
              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button className="btn-secondary" onClick={() => onCancel(b)}>
                  {t("dashboard.cancel") || "Cancel"}
                </button>
              )}
              {canReview(rec) && (
                <button className="btn-primary" onClick={() => onReview(b)}>
                  {t("review.leave_review", "Leave review")}
                </button>
              )}
            </div>
          </div>
        )})}
      </div>
    </>
  );
}

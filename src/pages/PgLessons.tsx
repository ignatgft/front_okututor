// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { usePageTitle } from "../components/pageTitleContext";
import { lessonsApi } from "../api/lessons.api";
import { bookingApi } from "../api/booking.api";
import { Badge, Spinner, EmptyState, ErrorState, Skeleton } from "../components/ui/Primitives";
import { LESSON_STATUS, BOOKING_STATUS, isTutorLike } from "../constants/enums";
import "../styles/Dashboard.css";

export default function PgLessons() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setPageTitle = usePageTitle();
  const [lessons, setLessons] = useState([]);

  useEffect(() => { setPageTitle(t("lessons.title", "Lessons")); }, [setPageTitle, t]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bookingToLessonStatus = (status) => {
    if (status === BOOKING_STATUS.CONFIRMED) return LESSON_STATUS.SCHEDULED;
    if (status === BOOKING_STATUS.COMPLETED) return LESSON_STATUS.COMPLETED;
    if (status === BOOKING_STATUS.CANCELLED || status === BOOKING_STATUS.REJECTED)
      return LESSON_STATUS.CANCELLED;
    return LESSON_STATUS.SCHEDULED;
  };

  // TODO(backend): remove fallback once GET /lessons is implemented
  const loadFromBookings = useCallback(async () => {
    const { response, data } = await (isTutorLike(user) ? bookingApi.teacher() : bookingApi.my());
    if (!response.ok) {
      setError(data.message || data.error || t("common.error", "Error"));
      return;
    }
    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.lessons)
          ? data.lessons
          : Array.isArray(data?.items)
            ? data.items
            : [];
    const rows = raw.map((b) => {
      const start = new Date(b.start_at);
      const joinableWithinWindow =
        b.status === BOOKING_STATUS.CONFIRMED &&
        start.getTime() - Date.now() < 15 * 60 * 1000 &&
        start.getTime() > Date.now() - 30 * 60 * 1000;
      return {
        id: b.id,
        title: b.course_title,
        counterpart: isTutorLike(user) ? b.student_name : b.teacher_name,
        start_at: b.start_at,
        end_at: b.end_at,
        status: bookingToLessonStatus(b.status),
        joinable: joinableWithinWindow,
      };
    });
    setLessons(rows);
  }, [user, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await lessonsApi.list();
      if (response.ok) {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data?.lessons)
              ? data.lessons
              : Array.isArray(data?.items)
                ? data.items
                : [];
        setLessons(list);
      } else {
        await loadFromBookings();
      }
    } catch {
      await loadFromBookings();
    } finally {
      setLoading(false);
    }
  }, [loadFromBookings]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (iso) => new Date(iso).toLocaleDateString();
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sorted = [...lessons].sort((a, b2) => new Date(b2.start_at) - new Date(a.start_at));

  return (
    <>
      {loading ? (
        <>
          <Spinner label={t("common.loading", "Loading...")} />
          <Skeleton count={4} />
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : sorted.length === 0 ? (
        <EmptyState icon="🎓" title={t("lessons.empty", "No lessons yet")} />
      ) : (
        <div className="bookings-list">
          {sorted.map((l) => (
            <div key={l.id} className="booking-card">
              <div className="booking-info">
                <h3>{l.title}</h3>
                <p>{l.counterpart}</p>
                <p className="booking-time">
                  {fmtDate(l.start_at)} · {fmtTime(l.start_at)}
                </p>
              </div>
              <div className="booking-actions">
                <Badge status={l.status}>{l.status}</Badge>
                {l.joinable && (
                  <button className="btn-primary" onClick={() => navigate(`/lesson/${l.id}`)}>
                    {t("lessons.join", "Join")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

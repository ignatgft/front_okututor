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
        start.getTime() - Date.now() < 10 * 60 * 1000 &&
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

  const fmtDate = (iso: string): string => new Date(iso).toLocaleDateString();
  const fmtTime = (iso: string): string => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sorted = [...lessons].sort((a, b2) => new Date(b2.start_at as string).getTime() - new Date(a.start_at as string).getTime());

  // Только предстоящий урок — ближайший по времени среди joinable — получает кнопку "Войти"
  const upcomingJoinableId = (() => {
    const now = Date.now();
    const candidates = lessons.filter((l: Record<string, unknown>) => {
      const s = l["status"] as string | undefined;
      const joinable = Boolean(l["joinable"] ?? (l as Record<string, unknown>)["canJoin"]);
      if (!joinable) return false;
      // Для SCHEDULED требуем окно 10 мин до начала (онлайн), для IN_PROGRESS — всегда
      if (s === "IN_PROGRESS") return true;
      if (s !== "SCHEDULED") return false;
      const start = new Date(l["start_at"] as string).getTime();
      if (Number.isNaN(start)) return false;
      const diff = start - now;
      return diff < 10 * 60 * 1000 && diff > -30 * 60 * 1000;
    });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => new Date(a["start_at"] as string).getTime() - new Date(b["start_at"] as string).getTime());
    return candidates[0]["id"] as string | number | null;
  })();

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
                {Boolean(l.joinable ?? (l as Record<string, unknown>)["canJoin"]) && l.id === upcomingJoinableId && (
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

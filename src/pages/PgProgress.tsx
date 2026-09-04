// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { apiClient } from "../api/http";
import { endpoints } from "../api/endpoints";
import { bookingApi } from "../api/booking.api";
import { isTutorLike } from "../constants/roles";
import { usePageTitle } from "../components/pageTitleContext";
import { Spinner, Skeleton, EmptyState, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/Progress.css";

export default function PgProgress() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const toast = useToast();
  const setPageTitle = usePageTitle();
  const [bookings, setBookings] = useState([]);

  useEffect(() => { setPageTitle(t("navbar.progress", "Прогресс")); }, [setPageTitle, t]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingsRes, coursesRes] = await Promise.all([
        isTutorLike(user?.role) ? bookingApi.teacher() : bookingApi.my(),
        user?.id ? apiClient.get(endpoints.courses.byTeacher(user.id), false) : Promise.resolve({ response: { ok: false }, data: [] }),
      ]);

      if (bookingsRes.response.ok) setBookings(bookingsRes.data.content || []);
      else setError(bookingsRes.data.error || t("errors.default", "Something went wrong."));
      if (coursesRes.response.ok) setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.content || []);
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setLoading(false);
    }
  }, [user, t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const upcomingBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").length;

  const stats = [
    { label: t("progress.total_bookings", "Всего занятий"), value: totalBookings },
    { label: t("progress.completed", "Завершено"), value: completedBookings },
    { label: t("progress.upcoming", "Предстоит"), value: upcomingBookings },
  ];

  return (
      <div className="progress-page">
        {loading ? (
          <>
            <Spinner label={t("common.loading", "Loading...")} />
            <Skeleton count={3} />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <>
            <div className="stats-cards">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              ))}
            </div>

            {courses.length > 0 ? (
              <div className="progress-courses">
                <h3>{t("progress.course_progress", "Прогресс по курсам")}</h3>
                {courses.map((c) => {
                  const courseBookings = bookings.filter((b) => b.course_id === c.id);
                  const completed = courseBookings.filter((b) => b.status === "COMPLETED").length;
                  const total = courseBookings.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div key={c.id} className="progress-course-row">
                      <div className="progress-course-info">
                        <span className="progress-course-name">{c.title}</span>
                        <span className="progress-course-pct">{pct}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="📈"
                title={t("progress.no_courses", "No course progress yet")}
                hint={t("progress.no_courses_hint", "Progress will appear here once you have booked lessons.")}
              />
            )}
          </>
        )}
      </div>
  );
}

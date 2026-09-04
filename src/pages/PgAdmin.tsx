// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api/http";
import { endpoints } from "../api/endpoints";
import { usePageTitle } from "../components/pageTitleContext";
import { ErrorState, Skeleton } from "../components/ui/Primitives";
import "../styles/Admin.css";

export default function PgAdmin() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("admin.dashboard", "Admin Dashboard")); }, [setPageTitle, t]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await apiClient.get(endpoints.admin.stats);
      if (response.ok) setStats(data);
      else setError(data.error || t("errors.default", "Something went wrong."));
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <>
      {loading ? (
        <Skeleton count={4} className="skeleton-card" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStats} />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><h3>{stats.total_users || 0}</h3><p>{t("admin.users", "Users")}</p></div>
            <div className="stat-card"><h3>{stats.total_courses || 0}</h3><p>{t("tutor_dashboard.courses", "Courses")}</p></div>
            <div className="stat-card"><h3>{stats.total_reviews || 0}</h3><p>{t("course.reviews", "Reviews")}</p></div>
            <div className="stat-card"><h3>{stats.total_bookings || 0}</h3><p>{t("tutor_dashboard.bookings", "Bookings")}</p></div>
          </div>

          <div className="pending-section">
            <h2>{t("admin.quick_actions", "Quick actions")}</h2>
            <div className="booking-actions">
              <Link to="/admin/users" className="btn-primary">{t("admin.manage_users", "Manage users")}</Link>
              <Link to="/admin/tutors" className="btn-secondary">{t("admin.tutor_applications", "Tutor applications")}</Link>
              <Link to="/admin/courses" className="btn-secondary">{t("admin.course_moderation", "Course moderation")}</Link>
              <Link to="/admin/reviews" className="btn-secondary">{t("admin.reviews_moderation", "Reviews")}</Link>
              <Link to="/admin/reports" className="btn-secondary">{t("admin.reports", "Reports")}</Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

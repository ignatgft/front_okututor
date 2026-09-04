// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { apiClient } from "../api/http";
import { endpoints } from "../api/endpoints";
import { usePageTitle } from "../components/pageTitleContext";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Spinner, EmptyState, ErrorState, Skeleton } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/Dashboard.css";

export default function PgTutorCourses() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("my_courses.title", "My Courses")); }, [setPageTitle, t]);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!user?.id) return;
      const { response, data } = await apiClient.get(endpoints.courses.byTeacher(user.id));
      if (response.ok) setCourses(Array.isArray(data) ? data : data.content || []);
      else setError(data.error || t("errors.default", "Something went wrong."));
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const deleteCourse = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(endpoints.courses.delete(deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("course.delete_success", "Course deleted successfully"));
      await loadCourses();
    } catch (e) {
      setError(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="courses-section">
        <Link to="/tutor/courses/create" className="btn-primary">
          {t("tutor_dashboard.create_course", "Create Course")}
        </Link>

        {loading ? (
          <>
            <Spinner label={t("common.loading", "Loading...")} />
            <Skeleton count={4} />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={loadCourses} />
        ) : courses.length === 0 ? (
          <EmptyState
            title={t("tutor_dashboard.no_courses", "You haven't created any courses yet.")}
            hint={
              <Link to="/tutor/courses/create" className="btn-primary">
                {t("tutor_dashboard.create_course", "Create Course")}
              </Link>
            }
          />
        ) : (
              <div className="courses-grid">
            {courses.map((c) => (
              <div key={c.id} className="course-card-admin">
                <div className="course-card-admin-header">
                  <h3>{c.title}</h3>
                  {c.status && (
                    <span className={`status-badge status-${String(c.status).toLowerCase()}`}>{c.status}</span>
                  )}
                </div>
                <p className="course-card-admin-desc">{c.description ? `${c.description.slice(0, 120)}${c.description.length > 120 ? "…" : ""}` : t("course.no_description", "No description")}</p>
                <div className="course-meta">
                  <span className="course-price">{c.price_per_hour} {c.currency || "KGS"}</span>
                  <span className="course-rating">{Number(c.average_rating || 0).toFixed(1)} ★</span>
                </div>
                <div className="course-card-admin-actions">
                  <Link to={`/tutor/courses/edit/${c.id}`} className="btn btn-secondary btn-sm">
                    {t("common.edit", "Edit")}
                  </Link>
                  <Link to={`/course/${c.id}`} className="btn btn-ghost btn-sm">
                    {t("cw.preview_as_student", "Preview as student")}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteTarget(c)}
                  >
                    {t("common.delete", "Delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={t("course.delete_confirm_title", "Delete course?")}
        message={t("course.delete_confirm_message", "This action cannot be undone.")}
        confirmLabel={t("common.delete", "Delete")}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCourse}
      />
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { studentsApi } from "../api/students.api";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { enrollmentStatusLabel } from "../utils/statusLabels";
import "../styles/Dashboard.css";

export default function PgStudentRequests() {
  const { t } = useTranslation();
  const toast = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("student_requests.title", "My Requests")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await studentsApi.myEnrollments();
      if (response.ok) {
        setEnrollments(Array.isArray(data) ? data : data.content || []);
      } else {
        setError(data.message || data.error || t("common.error", "Error"));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = enrollments.filter((e2) => e2.status === ENROLLMENT_STATUS.PENDING);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await studentsApi.cancelEnrollment(cancelTarget.id);
      toast.success(t("student_requests.cancel_success", "Request cancelled"));
      setCancelTarget(null);
      await load();
    } catch (e2) {
      toast.error(e2.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon="📨"
          title={t("student_requests.empty", "No requests yet")}
          hint={
            <Link to="/student/search" className="btn-primary">
              {t("dashboard.find_tutors", "Find Tutors")}
            </Link>
          }
        />
      ) : (
        <div className="bookings-list">
          {enrollments.map((e2) => (
            <div key={e2.id} className="booking-card">
              <Link to={`/student/requests/${e2.id}`} className="booking-info-link">
                <div className="booking-info">
                  <h3>{e2.course_title || e2.course?.title}</h3>
                  <p>{e2.teacher_name || e2.course?.teacher_name}</p>
                  {e2.created_at && (
                    <p className="booking-time">{new Date(e2.created_at).toLocaleDateString()}</p>
                  )}
                </div>
              </Link>
              <div className="booking-actions">
                <Badge status={e2.status}>{enrollmentStatusLabel(e2.status, t)}</Badge>
                <Link to={`/student/requests/${e2.id}`} className="btn-secondary">
                  {t("request_detail.view_schedule", "View details")}
                </Link>
                {e2.status === ENROLLMENT_STATUS.PENDING && (
                  <button className="btn-danger" onClick={() => setCancelTarget(e2)}>
                    {t("common.cancel_request", "Cancel")}
                  </button>
                )}
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="empty-state-hint">{t("student_requests.no_pending", "No pending requests")}</p>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        title={t("student_requests.cancel_title", "Cancel request?")}
        message={t(
          "student_requests.cancel_message",
          "Your request to join \"{{course}}\" will be withdrawn.",
          { course: cancelTarget?.course_title || cancelTarget?.course?.title || "" }
        )}
        confirmLabel={t("common.cancel_request", "Cancel")}
        loading={actionLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { studentsApi } from "../api/students.api";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { Tabs } from "../components/ui/Tabs";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { enrollmentStatusLabel } from "../utils/statusLabels";
import { STUDENT_TABS, canStudentMessage, canViewScheduleProposal, canStudentCancel, openDirectChat } from "../utils/enrollmentHelpers";
import "../styles/Dashboard.css";

export default function PgStudentRequests() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState("awaiting");
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

  const tabs = [
    { value: "awaiting", label: t("student_requests.tab_awaiting", "Awaiting") },
    { value: "action", label: t("student_requests.tab_action", "Action needed") },
    { value: "active", label: t("student_requests.tab_active", "Active") },
    { value: "archive", label: t("student_requests.tab_archive", "Archive") },
  ];

  const visible = enrollments.filter((e) => (STUDENT_TABS[tab] || []).includes(e.status));
  const hasAny = enrollments.length > 0;

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

  const getTeacherId = (e) => e.teacher_id || e.teacher?.id || e.course?.teacher_id || null;

  return (
    <>
      <Tabs items={tabs} active={tab} onChange={setTab} id="student-requests-tabs" />
      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !hasAny ? (
        <EmptyState
          title={t("student_requests.empty", "No requests yet")}
          hint={
            <Link to="/student/search" className="btn-primary">
              {t("dashboard.find_tutors", "Find Tutors")}
            </Link>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t("student_requests.empty_tab", "Nothing in this tab")}
          hint={t("student_requests.empty_tab_hint", "Check other tabs — you have requests elsewhere.")}
        />
      ) : (
        <div className="bookings-list">
          {visible.map((e2) => (
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
                {e2.status === ENROLLMENT_STATUS.NEEDS_INFO && (
                  <Link to={`/student/requests/${e2.id}`} className="btn-primary">
                    {t("needs_info.provide", "Reply")}
                  </Link>
                )}
                {canViewScheduleProposal(e2.status) && e2.status !== ENROLLMENT_STATUS.SCHEDULED && (
                  <Link to={`/student/requests/${e2.id}`} className="btn-primary">
                    {t("student_requests.view_proposal", "View proposal")}
                  </Link>
                )}
                {e2.status === ENROLLMENT_STATUS.SCHEDULED && (
                  <Link to="/student/schedule" className="btn-primary">
                    {t("student_requests.view_schedule", "My schedule")}
                  </Link>
                )}
                {e2.status === ENROLLMENT_STATUS.COMPLETED && (
                  <Link to={e2.course_id || e2.course?.id ? `/course/${e2.course_id || e2.course.id}` : "/student/courses"} className="btn-primary">
                    {t("request_detail.review_tutor", "Leave a review")}
                  </Link>
                )}
                {canStudentMessage(e2.status) && (
                  <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "STUDENT", getTeacherId(e2))}>
                    {t("request_detail.message_tutor", "Message tutor")}
                  </button>
                )}
                {canStudentCancel(e2.status) && (
                  <button type="button" className="btn-danger" onClick={() => setCancelTarget(e2)}>
                    {t("common.cancel_request", "Cancel")}
                  </button>
                )}
              </div>
            </div>
          ))}
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

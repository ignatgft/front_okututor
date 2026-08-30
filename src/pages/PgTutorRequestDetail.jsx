import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { enrollmentsApi } from "../api/students.api";
import { Badge, Spinner, ErrorState } from "../components/ui/Primitives";
import { Modal } from "../components/ui/Overlay";
import { Timeline } from "../components/ui/Timeline";
import { PageHeader } from "../components/ui/PageHeader";
import ScheduleModal from "../components/ScheduleModal";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { applicationStatusLabel } from "../utils/statusLabels";
import { buildApplicationTimeline } from "../utils/applicationTimeline";
import "../styles/Dashboard.css";
import "../styles/overlay.css";

export default function PgTutorRequestDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const toast = useToast();
  const setPageTitle = usePageTitle();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => { setPageTitle(t("request_detail.title", "Application details")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await enrollmentsApi.byId(id);
      if (response.ok) setEnrollment(data);
      else setError(data?.message || data?.error || t("common.error", "Error"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const handleReject = async () => {
    setRejecting(true);
    try {
      await enrollmentsApi.reject(enrollment.id, { reason: rejectReason });
      toast.success(t("success.action_completed", "Action completed"));
      setShowReject(false);
      setRejectReason("");
      load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setRejecting(false);
    }
  };

  const status = enrollment?.status;
  const actionable =
    status === ENROLLMENT_STATUS.PENDING ||
    status === ENROLLMENT_STATUS.NEEDS_INFO ||
    status === ENROLLMENT_STATUS.ACCEPTED ||
    status === ENROLLMENT_STATUS.SCHEDULE_PENDING;
  const timeline = buildApplicationTimeline(status);

  return (
    <>
      <PageHeader
        title={t("request_detail.title")}
        actions={
          <>
            <Link to="/tutor/requests" className="btn-secondary">
              {t("tutor_request.title", "Requests")}
            </Link>
            {actionable && (
              <>
                <button className="btn-primary" onClick={() => setShowSchedule(true)}>
                  {t("tutor_request.accept", "Accept")}
                </button>
                <button className="btn-danger" onClick={() => setShowReject(true)}>
                  {t("tutor_request.reject", "Reject")}
                </button>
              </>
            )}
          </>
        }
      />

      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !enrollment ? (
        <ErrorState message={t("common.not_found", "Not found")} onRetry={load} />
      ) : (
        <div className="dashboard-section">
          <div className="booking-card">
            <div className="booking-info">
              <h3>{enrollment.student_name || enrollment.student?.full_name}</h3>
              <p>{enrollment.course_title || enrollment.course?.title}</p>
              {enrollment.created_at && (
                <p className="booking-time">{new Date(enrollment.created_at).toLocaleString()}</p>
              )}
              <Badge status={status}>{applicationStatusLabel(status, t)}</Badge>
            </div>
          </div>

          {enrollment.preferred_schedule && (
            <div className="detail-block">
              <h4>{t("request_detail.preferences", "Preferences")}</h4>
              <p>🕐 {enrollment.preferred_schedule}</p>
            </div>
          )}

          {enrollment.message && (
            <div className="detail-block">
              <h4>{t("request_detail.comment", "Comment")}</h4>
              <p>«{enrollment.message}»</p>
            </div>
          )}

          <div className="detail-block">
            <h4>{t("request_detail.timeline", "Timeline")}</h4>
            <Timeline steps={timeline.map((s) => ({ id: s.key, title: t(s.titleKey), state: s.state }))} />
          </div>

          {(enrollment.course_id || enrollment.course?.id) && (
            <Link
              to={`/courses/${enrollment.course_id || enrollment.course.id}`}
              className="btn-secondary"
            >
              {t("request_detail.course", "Course")}
            </Link>
          )}
        </div>
      )}

      {showSchedule && enrollment && (
        <ScheduleModal
          enrollment={enrollment}
          onClose={() => setShowSchedule(false)}
          onSuccess={() => {
            toast.success(t("success.action_completed", "Action completed"));
            setShowSchedule(false);
            load();
          }}
        />
      )}

      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title={t("tutor_request.reject_title", "Reason for rejection")}
      >
        <form
          className="modal-form"
          onSubmit={(e) => { e.preventDefault(); handleReject(); }}
        >
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("tutor_request.reject_placeholder", "Write a reason (optional)")}
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowReject(false)}>
              {t("common.cancel", "Cancel")}
            </button>
            <button type="submit" className="btn-danger" disabled={rejecting}>
              {rejecting ? t("common.loading", "Loading...") : t("tutor_request.reject_confirm", "Reject request")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

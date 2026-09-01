import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { enrollmentsApi } from "../api/enrollments.api";
import { Badge, Spinner, ErrorState } from "../components/ui/Primitives";
import { Modal } from "../components/ui/Overlay";
import { Timeline } from "../components/ui/Timeline";
import { PageHeader } from "../components/ui/PageHeader";
import { ScheduleWizard } from "../components/schedule/ScheduleWizard";
import { useTutorAvailability } from "../hooks/useTutorAvailability";
import useAuthStore from "../store/authStore";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { applicationStatusLabel } from "../utils/statusLabels";
import { buildApplicationTimeline } from "../utils/applicationTimeline";
import { getUserTimezone } from "../utils/timezone";
import { canTutorAct, canTutorMessage, canAssignSchedule, canReschedule, openDirectChat } from "../utils/enrollmentHelpers";
import "../styles/Dashboard.css";
import "../styles/overlay.css";

function formatDateLocale(iso, locale) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString(locale); } catch { return iso; }
}

export default function PgTutorRequestDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const setPageTitle = usePageTitle();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoQuestion, setInfoQuestion] = useState("");
  const [infoSending, setInfoSending] = useState(false);

  const tutorId = useAuthStore((s) => s.user?.id);
  const { availability: tutorAvailability } = useTutorAvailability(tutorId);

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

  const handleRequestInfo = async () => {
    setInfoSending(true);
    try {
      await enrollmentsApi.requestInfo(enrollment.id, { question: infoQuestion });
      toast.success(t("needs_info.request_sent", "Request sent to the student"));
      setShowInfo(false);
      setInfoQuestion("");
      load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setInfoSending(false);
    }
  };

  const status = enrollment?.status;
  const locale = i18n.language || "ru";
  const studentId = enrollment?.student_id || enrollment?.student?.id || null;
  const courseId = enrollment?.course_id || enrollment?.course?.id || null;
  const canAct = canTutorAct(status);
  const canMessage = canTutorMessage(status);
  const showAssign = canAssignSchedule(status);
  const showReschedule = canReschedule(status);
  const isTerminal = [ENROLLMENT_STATUS.REJECTED, ENROLLMENT_STATUS.CANCELLED, ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.EXPIRED].includes(status);
  const timeline = buildApplicationTimeline(status, { role: "tutor" });
  const hintKey = {
    [ENROLLMENT_STATUS.PENDING]: "request_detail.hint_pending_tutor",
    [ENROLLMENT_STATUS.NEEDS_INFO]: "request_detail.hint_needs_info_tutor",
    [ENROLLMENT_STATUS.ACCEPTED]: "request_detail.hint_accepted_tutor",
    [ENROLLMENT_STATUS.SCHEDULE_PENDING]: "request_detail.hint_schedule_pending_tutor",
    [ENROLLMENT_STATUS.SCHEDULE_PROPOSED]: "request_detail.hint_schedule_proposed_tutor",
    [ENROLLMENT_STATUS.SCHEDULED]: "request_detail.hint_scheduled_tutor",
  }[status];

  return (
    <>
      <PageHeader
        title={t("request_detail.title")}
        actions={
          <>
            <Link to="/tutor/requests" className="btn-secondary">
              {t("tutor_request.title", "Requests")}
            </Link>
            {canMessage && (
              <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "TUTOR", studentId)}>
                {t("tutor_request.message_student", "Message student")}
              </button>
            )}
            {showAssign && (
              <button type="button" className="btn-primary" onClick={() => setShowSchedule(true)}>
                {t("tutor_request.assign_schedule", "Assign schedule")}
              </button>
            )}
            {showReschedule && !showAssign && (
              <button type="button" className="btn-secondary" onClick={() => setShowSchedule(true)}>
                {t("tutor_request.reschedule", "Change schedule")}
              </button>
            )}
            {canAct && (
              <>
                <button type="button" className="btn-secondary" onClick={() => setShowInfo(true)} disabled={status === ENROLLMENT_STATUS.NEEDS_INFO}>
                  {t("needs_info.request", "Request info")}
                </button>
                <button type="button" className="btn-danger" onClick={() => setShowReject(true)}>
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
                <p className="booking-time">{formatDateLocale(enrollment.created_at, locale)}</p>
              )}
              <p className="booking-meta">
                <Badge status={status}>{applicationStatusLabel(status, t)}</Badge>
                {hintKey && <span className="status-hint">{t(hintKey, "")}</span>}
              </p>
            </div>
            <div className="booking-actions">
              {canMessage && (
                <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "TUTOR", studentId)}>
                  {t("tutor_request.message_student", "Message student")}
                </button>
              )}
            </div>
          </div>

          {enrollment.preferred_schedule && (
            <div className="detail-block">
              <h4>{t("request_detail.preferences", "Preferences")}</h4>
              <p>{enrollment.preferred_schedule} {t("common.in_timezone", "({{tz}})", { tz: getUserTimezone() })}</p>
            </div>
          )}

          {enrollment.message && (
            <div className="detail-block">
              <h4>{t("request_detail.comment", "Comment")}</h4>
              <p>{enrollment.message}</p>
            </div>
          )}

          <div className="detail-block">
            <h4>{t("request_detail.timeline", "Timeline")}</h4>
            <Timeline steps={timeline.map((s) => ({ id: s.key, title: t(s.titleKey), state: s.state }))} />
          </div>

          {(status === ENROLLMENT_STATUS.SCHEDULE_PROPOSED || status === ENROLLMENT_STATUS.SCHEDULE_PENDING) && (
            <div className="detail-block highlight-block">
              <p>{t("request_detail.awaiting_student_confirm", "Awaiting student confirmation")}</p>
              <button type="button" className="btn-secondary" onClick={() => setShowSchedule(true)}>
                {t("tutor_request.reschedule", "Change schedule")}
              </button>
            </div>
          )}

          {status === ENROLLMENT_STATUS.SCHEDULED && (
            <div className="detail-block highlight-block">
              <p>{t("request_detail.schedule_confirmed_title", "Schedule confirmed")}</p>
              <div className="booking-actions" style={{ marginTop: 8 }}>
                <Link to="/tutor/schedule" className="btn-primary">{t("navbar.schedule", "Schedule")}</Link>
                <Link to="/tutor/lessons" className="btn-secondary">{t("lessons.title", "Lessons")}</Link>
                {enrollment.lesson_id || enrollment.booking_id ? (
                  <Link to={`/lesson/${enrollment.lesson_id || enrollment.booking_id}`} className="btn-secondary">{t("lessons.join", "Join")}</Link>
                ) : null}
              </div>
            </div>
          )}

          {courseId && (
            <Link to={`/course/${courseId}`} className="btn-secondary">
              {t("request_detail.course", "Course")}
            </Link>
          )}
          {isTerminal && (
            <p className="status-hint" style={{ marginTop: 8 }}>{t("request_detail.hint_terminal", "This application is closed.")}</p>
          )}
        </div>
      )}

      {showSchedule && enrollment && (
        <ScheduleWizard
          enrollment={enrollment}
          tutorAvailability={tutorAvailability}
          studentInput={{
            days: enrollment.preferred_days || [],
            startTime: enrollment.preferred_start_time || enrollment.preferred_time || "",
            endTime: enrollment.preferred_end_time || "",
          }}
          onClose={() => setShowSchedule(false)}
          onSuccess={() => {
            toast.success(t("success.action_completed", "Action completed"));
            setShowSchedule(false);
            load();
          }}
        />
      )}

      <Modal
        open={showInfo}
        onClose={() => setShowInfo(false)}
        title={t("needs_info.request", "Request info")}
      >
        <form
          className="modal-form"
          onSubmit={(e) => { e.preventDefault(); handleRequestInfo(); }}
        >
          <textarea
            rows={3}
            value={infoQuestion}
            onChange={(e) => setInfoQuestion(e.target.value)}
            placeholder={t("needs_info.question_placeholder", "Clarify...")}
            required
          />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowInfo(false)}>
              {t("common.cancel", "Cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={infoSending}>
              {infoSending ? t("common.loading", "Loading...") : t("needs_info.request", "Request info")}
            </button>
          </div>
        </form>
      </Modal>

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

import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { enrollmentsApi } from "../api/enrollments.api";
import { studentsApi } from "../api/students.api";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Badge, Spinner, ErrorState } from "../components/ui/Primitives";
import { Timeline } from "../components/ui/Timeline";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { applicationStatusLabel } from "../utils/statusLabels";
import { buildApplicationTimeline } from "../utils/applicationTimeline";
import { getUserTimezone } from "../utils/timezone";
import { canStudentMessage, canStudentCancel, canViewScheduleProposal, canStudentConfirmSchedule, openDirectChat } from "../utils/enrollmentHelpers";
import { scheduleApi, buildProposePayload } from "../api/schedule.api";
import { getErrorMessage } from "../utils/errorMessage";
import "../styles/Dashboard.css";
import "../styles/overlay.css";

function formatDateLocale(iso, locale) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(locale);
  } catch {
    return iso;
  }
}

function downloadIcs(enrollment, t) {
  const title = enrollment.course_title || enrollment.course?.title || "Lesson";
  const start = enrollment.schedule?.start_at || enrollment.proposed_start_at || enrollment.start_at;
  const end = enrollment.schedule?.end_at || enrollment.proposed_end_at || enrollment.end_at;
  if (!start) return;
  const dtStart = new Date(start);
  const dtEnd = end ? new Date(end) : new Date(dtStart.getTime() + 60 * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  const toIcs = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${toIcs(dtStart)}\nDTEND:${toIcs(dtEnd)}\nDESCRIPTION:${t("request_detail.ics_description", "Lesson via Okututor")}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PgStudentRequestDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const setPageTitle = usePageTitle();

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [infoReply, setInfoReply] = useState("");
  const [infoSending, setInfoSending] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalActionLoading, setProposalActionLoading] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [counterDays, setCounterDays] = useState(["monday"]);
  const [counterTime, setCounterTime] = useState("09:00");
  const [counterDuration, setCounterDuration] = useState(60);
  const [counterMessage, setCounterMessage] = useState("");

  useEffect(() => { setPageTitle(t("request_detail.title", "Application details")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await enrollmentsApi.byId(id);
      if (response.ok) {
        setEnrollment(data);
      } else {
        setError(data?.message || data?.error || t("common.error", "Error"));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const loadProposals = useCallback(async () => {
    if (!enrollment?.id || ![ENROLLMENT_STATUS.SCHEDULE_PROPOSED, ENROLLMENT_STATUS.SCHEDULE_PENDING].includes(enrollment.status)) {
      setProposals([]);
      return;
    }
    setProposalsLoading(true);
    try {
      const { response, data } = await scheduleApi.listProposals(enrollment.id);
      if (response.ok) {
        const list = Array.isArray(data) ? data : data.content || data.proposals || [];
        // newest pending first
        const sorted = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setProposals(sorted);
      } else {
        setProposals([]);
      }
    } catch {
      setProposals([]);
    } finally {
      setProposalsLoading(false);
    }
  }, [enrollment?.id, enrollment?.status]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const status = enrollment?.status;
  const isTerminal = [ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.CANCELLED, ENROLLMENT_STATUS.REJECTED, ENROLLMENT_STATUS.EXPIRED].includes(status);
  const timeline = buildApplicationTimeline(status, { role: "student" });
  const locale = i18n.language || "ru";
  const teacherId = enrollment?.teacher_id || enrollment?.teacher?.id || enrollment?.course?.teacher_id || null;
  const courseId = enrollment?.course_id || enrollment?.course?.id || null;
  const schedule = enrollment?.schedule || enrollment?.proposed_schedule || null;
  const scheduleText = schedule ? `${schedule.date || ""} ${schedule.time || ""} ${schedule.days?.join(", ") || ""}`.trim() : enrollment?.preferred_schedule || "";

  const hintKey = {
    [ENROLLMENT_STATUS.PENDING]: "request_detail.hint_pending",
    [ENROLLMENT_STATUS.NEEDS_INFO]: "request_detail.hint_needs_info",
    [ENROLLMENT_STATUS.ACCEPTED]: "request_detail.hint_accepted",
    [ENROLLMENT_STATUS.SCHEDULE_PENDING]: "request_detail.hint_schedule_pending",
    [ENROLLMENT_STATUS.SCHEDULE_PROPOSED]: "request_detail.hint_schedule_proposed",
    [ENROLLMENT_STATUS.SCHEDULED]: "request_detail.hint_scheduled",
  }[status];

  const pendingProposal = proposals.find((p) => p.status === "PENDING") || proposals[0] || null;
  const canConfirm = canStudentConfirmSchedule(status, pendingProposal);

  const handleAcceptProposal = async () => {
    if (!pendingProposal) return;
    setProposalActionLoading(true);
    try {
      const { response, data } = await scheduleApi.acceptProposal(pendingProposal.id);
      if (response.ok) {
        toast.success(t("schedule.proposal_accepted", "Schedule confirmed"));
        await load();
        await loadProposals();
      } else {
        toast.error(getErrorMessage(data, t) || t("errors.default"));
      }
    } catch (e) {
      toast.error(getErrorMessage(e, t) || e.message);
    } finally {
      setProposalActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!pendingProposal) return;
    setProposalActionLoading(true);
    try {
      const { response, data } = await scheduleApi.rejectProposal(pendingProposal.id);
      if (response.ok) {
        toast.success(t("schedule.proposal_rejected", "Proposal rejected"));
        await load();
        await loadProposals();
      } else {
        toast.error(getErrorMessage(data, t) || t("errors.default"));
      }
    } catch (e) {
      toast.error(getErrorMessage(e, t) || e.message);
    } finally {
      setProposalActionLoading(false);
    }
  };

  const toggleCounterDay = (d) => {
    setCounterDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  useEffect(() => {
    if (showCounter && pendingProposal) {
      const days = (pendingProposal.slots || []).map((s) => String(s.weekday).toLowerCase());
      if (days.length) setCounterDays(days);
      if (pendingProposal.slots?.[0]?.start_time) setCounterTime(pendingProposal.slots[0].start_time);
      if (pendingProposal.duration_minutes) setCounterDuration(pendingProposal.duration_minutes);
    }
  }, [showCounter, pendingProposal]);

  const handleCounterProposal = async (e) => {
    e.preventDefault();
    if (!pendingProposal) return;
    if (counterDays.length === 0) {
      toast.error(t("schedule_wizard.days_required", "Select at least one day"));
      return;
    }
    if (!counterTime) {
      toast.error(t("validation.required", "Required"));
      return;
    }
    setProposalActionLoading(true);
    try {
      const payload = buildProposePayload({
        timezone: pendingProposal.timezone || getUserTimezone(),
        format: pendingProposal.format || enrollment?.preferred_format || "ONLINE",
        start_date: pendingProposal.start_date,
        end_date: pendingProposal.end_date,
        duration_minutes: counterDuration,
        days: counterDays,
        time: counterTime,
        location: null,
        message: counterMessage || undefined,
      });
      const { response, data } = await scheduleApi.counterProposal(pendingProposal.id, payload);
      if (response.ok) {
        toast.success(t("schedule.counter_sent", "Counter-proposal sent"));
        setShowCounter(false);
        setCounterMessage("");
        await load();
        await loadProposals();
      } else {
        toast.error(getErrorMessage(data, t) || t("errors.default"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, t) || err.message);
    } finally {
      setProposalActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!enrollment) return;
    setCancelLoading(true);
    try {
      await studentsApi.cancelEnrollment(enrollment.id);
      toast.success(t("student_requests.cancel_success", "Request cancelled"));
      setEnrollment({ ...enrollment, status: ENROLLMENT_STATUS.CANCELLED });
      setShowCancel(false);
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleProvideInfo = async (e) => {
    e.preventDefault();
    if (!infoReply.trim()) return;
    setInfoSending(true);
    try {
      await enrollmentsApi.provideInfo(enrollment.id, { message: infoReply });
      toast.success(t("needs_info.provided", "Answer sent"));
      setInfoReply("");
      load();
    } catch (err) {
      toast.error(err.message || t("errors.default", "Something went wrong."));
    } finally {
      setInfoSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("request_detail.title")}
        actions={
          <>
            <Link to="/student/requests" className="btn-secondary">
              {t("request_detail.back_to_requests", "All requests")}
            </Link>
            {canStudentCancel(status) && (
              <button className="btn-danger" onClick={() => setShowCancel(true)}>
                {t("student_requests.cancel_title", "Cancel request")}
              </button>
            )}
            {canStudentMessage(status) && (
              <button type="button" className="btn-primary" onClick={() => openDirectChat(navigate, "STUDENT", teacherId)}>
                {t("request_detail.message_tutor", "Message tutor")}
              </button>
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
              <h3>{enrollment.course_title || enrollment.course?.title}</h3>
              <p>{enrollment.teacher_name || enrollment.course?.teacher_name}</p>
              {enrollment.created_at && (
                <p className="booking-time">{formatDateLocale(enrollment.created_at, locale)}</p>
              )}
              <p className="booking-meta">
                <Badge status={status}>{applicationStatusLabel(status, t)}</Badge>
                {hintKey && <span className="status-hint">{t(hintKey, "")}</span>}
              </p>
            </div>
            <div className="booking-actions">
              {courseId && (
                <Link to={`/course/${courseId}`} className="btn-secondary">
                  {t("request_detail.course", "Course")}
                </Link>
              )}
              {canStudentMessage(status) && (
                <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "STUDENT", teacherId)}>
                  {t("request_detail.message_tutor", "Message tutor")}
                </button>
              )}
              <Link to={`/student/requests/${enrollment.id}`} className="btn-secondary" style={{ display: "none" }} aria-hidden="true" />
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

          {canViewScheduleProposal(status) && (
            <div className="detail-block highlight-block" id="proposal">
              <h4>{t("request_detail.proposal_title", "Schedule proposal")}</h4>
              {proposalsLoading ? (
                <p>{t("common.loading", "Loading...")}</p>
              ) : pendingProposal ? (
                <>
                  <div className="proposal-details" style={{ margin: "8px 0" }}>
                    <p>
                      <strong>{t("schedule_wizard.days", "Days")}:</strong>{" "}
                      {pendingProposal.slots?.map((s) => t(`calendar.day_${String(s.weekday).toLowerCase()}`, s.weekday)).join(", ") || scheduleText}
                    </p>
                    {pendingProposal.slots?.[0] && (
                      <p>
                        <strong>{t("schedule_wizard.time", "Time")}:</strong> {pendingProposal.slots[0].start_time}–{pendingProposal.slots[0].end_time}
                      </p>
                    )}
                    <p>
                      <strong>{t("schedule_wizard.start_date", "Start date")}:</strong> {pendingProposal.start_date} → {pendingProposal.end_date}
                    </p>
                    <p>
                      <strong>{t("schedule_wizard.duration", "Duration")}:</strong> {pendingProposal.duration_minutes} {t("schedule.minutes_short", "min")}
                    </p>
                    {pendingProposal.message && <p><em>{pendingProposal.message}</em></p>}
                    <p className="status-hint">
                      {t("common.in_timezone", "({{tz}})", { tz: pendingProposal.timezone || getUserTimezone() })}
                    </p>
                  </div>
                  {canConfirm ? (
                    <>
                      <div className="booking-actions" style={{ marginTop: 8 }}>
                        <button type="button" className="btn-primary" onClick={handleAcceptProposal} disabled={proposalActionLoading}>
                          {proposalActionLoading ? t("common.loading", "Loading...") : t("request_detail.accept_schedule", "Confirm schedule")}
                        </button>
                        <button type="button" className="btn-secondary" onClick={handleRejectProposal} disabled={proposalActionLoading}>
                          {t("request_detail.reject_proposal", "Reject")}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setShowCounter((v) => !v)}
                          disabled={proposalActionLoading}
                        >
                          {t("schedule.counter_propose", "Propose another time")}
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "STUDENT", teacherId)}>
                          {t("request_detail.message_tutor", "Message tutor")}
                        </button>
                      </div>
                      {showCounter && (
                        <form onSubmit={handleCounterProposal} className="counter-form" style={{ marginTop: 12, borderTop: "1px solid var(--border, #eee)", paddingTop: 12 }}>
                          <h5>{t("schedule.counter_title", "Suggest another time")}</h5>
                          <div className="form-field">
                            <label>{t("schedule_wizard.days", "Days")}</label>
                            <div className="day-row" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => (
                                <label key={d} className={`day-toggle ${counterDays.includes(d) ? "day-toggle-active" : ""}`} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}>
                                  <input type="checkbox" checked={counterDays.includes(d)} onChange={() => toggleCounterDay(d)} style={{ marginRight: 4 }} />
                                  {t(`calendar.day_${d}`, d.slice(0, 2))}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="form-row" style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <div className="form-field">
                              <label>{t("schedule_wizard.time", "Time")}</label>
                              <input type="time" value={counterTime} onChange={(e) => setCounterTime(e.target.value)} required />
                            </div>
                            <div className="form-field">
                              <label>{t("schedule_wizard.duration", "Duration")}</label>
                              <select value={counterDuration} onChange={(e) => setCounterDuration(Number(e.target.value))}>
                                <option value={30}>30 {t("schedule.minutes_short", "min")}</option>
                                <option value={45}>45 {t("schedule.minutes_short", "min")}</option>
                                <option value={60}>60 {t("schedule.minutes_short", "min")}</option>
                                <option value={90}>90 {t("schedule.minutes_short", "min")}</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-field" style={{ marginTop: 8 }}>
                            <label>{t("common.message", "Message")} ({t("common.optional", "optional")})</label>
                            <textarea rows={2} value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} placeholder={t("schedule.counter_message_placeholder", "e.g. Evening works better for me")} />
                          </div>
                          <div className="modal-actions" style={{ marginTop: 8 }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowCounter(false)} disabled={proposalActionLoading}>
                              {t("common.cancel", "Cancel")}
                            </button>
                            <button type="submit" className="btn-primary" disabled={proposalActionLoading}>
                              {proposalActionLoading ? t("common.loading", "Loading...") : t("schedule.counter_send", "Send proposal")}
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  ) : (
                    <div className="booking-actions" style={{ marginTop: 8 }}>
                      <button type="button" className="btn-secondary" onClick={() => openDirectChat(navigate, "STUDENT", teacherId)}>
                        {t("request_detail.message_tutor", "Message tutor")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>{scheduleText || t("request_detail.awaiting_confirmation", "Awaiting schedule confirmation")}</p>
                  <div className="booking-actions" style={{ marginTop: 8 }}>
                    <button type="button" className="btn-secondary" onClick={() => openDirectChat(navigate, "STUDENT", teacherId)}>
                      {t("request_detail.message_tutor", "Message tutor")}
                    </button>
                  </div>
                  <p className="status-hint">{t("request_detail.hint_schedule_proposed", "Tutor proposed a schedule. Check details and message for changes.")}</p>
                </>
              )}
            </div>
          )}

          {status === ENROLLMENT_STATUS.SCHEDULED && (
            <div className="detail-block highlight-block">
              <h4>{t("request_detail.schedule_confirmed_title", "Schedule confirmed")}</h4>
              <p>{scheduleText}</p>
              <div className="booking-actions" style={{ marginTop: 8, flexWrap: "wrap" }}>
                <Link to="/student/schedule" className="btn-primary">{t("student_requests.view_schedule", "My schedule")}</Link>
                <Link to="/student/lessons" className="btn-secondary">{t("lessons.title", "Lessons")}</Link>
                {enrollment.lesson_id || enrollment.booking_id ? (
                  <Link to={`/lesson/${enrollment.lesson_id || enrollment.booking_id}`} className="btn-secondary">{t("lessons.join", "Join")}</Link>
                ) : null}
                <button type="button" className="btn-ghost" onClick={() => downloadIcs(enrollment, t)}>{t("request_detail.add_to_calendar", "Add to calendar")}</button>
                <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "STUDENT", teacherId)}>{t("request_detail.message_tutor", "Message tutor")}</button>
              </div>
            </div>
          )}

          {status === ENROLLMENT_STATUS.NEEDS_INFO && (
            <div className="detail-block highlight-block">
              <h4>{t("needs_info.provide_title", "Additional information")}</h4>
              <form className="modal-form" onSubmit={handleProvideInfo}>
                <textarea
                  rows={3}
                  value={infoReply}
                  onChange={(e) => setInfoReply(e.target.value)}
                  placeholder={t("needs_info.provide_placeholder", "Provide clarifying information...")}
                  required
                />
                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={infoSending}>
                    {infoSending ? t("common.loading", "Loading...") : t("needs_info.provide", "Reply to tutor")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isTerminal && status === ENROLLMENT_STATUS.COMPLETED && (
            <div className="detail-block highlight-block">
              <p>{t("request_detail.lesson_completed", "Lessons completed in this course.")}</p>
              <Link to={courseId ? `/course/${courseId}` : "/student/courses"} className="btn-primary">
                {t("request_detail.review_tutor", "Leave a review")}
              </Link>
            </div>
          )}
          {isTerminal && (status === ENROLLMENT_STATUS.REJECTED || status === ENROLLMENT_STATUS.CANCELLED) && (
            <div className="detail-block">
              <p>{t("request_detail.hint_rejected", "This application is closed.")}</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showCancel}
        title={t("student_requests.cancel_title", "Cancel request?")}
        message={t(
          "student_requests.cancel_message",
          "Your request to join \"{{course}}\" will be withdrawn.",
          { course: enrollment?.course_title || enrollment?.course?.title || "" }
        )}
        confirmLabel={t("common.cancel_request", "Cancel request")}
        loading={cancelLoading}
        onCancel={() => setShowCancel(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}

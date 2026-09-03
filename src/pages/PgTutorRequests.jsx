import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { enrollmentsApi } from "../api/enrollments.api";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { Tabs } from "../components/ui/Tabs";
import ScheduleModal from "../components/ScheduleModal";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { applicationStatusLabel } from "../utils/statusLabels";
import { TUTOR_TABS, canAssignSchedule, canReschedule, canTutorMessage, openDirectChat } from "../utils/enrollmentHelpers";
import "../styles/Dashboard.css";
import "../styles/overlay.css";

export default function PgTutorRequests() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const setPageTitle = usePageTitle();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("new");
  const [scheduleTarget, setScheduleTarget] = useState(null);

  useEffect(() => { setPageTitle(t("tutor_request.title", "Requests")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await enrollmentsApi.tutorRequests();
      if (response.ok) {
        setRequests(Array.isArray(data) ? data : data.content || []);
      } else {
        setError(data?.message || data?.error || t("common.error", "Error"));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    new: requests.filter((r) => TUTOR_TABS.new.includes(r.status)).length,
    waiting: requests.filter((r) => TUTOR_TABS.waiting.includes(r.status)).length,
    schedule: requests.filter((r) => TUTOR_TABS.schedule.includes(r.status)).length,
    active: requests.filter((r) => TUTOR_TABS.active.includes(r.status)).length,
    archive: requests.filter((r) => TUTOR_TABS.archive.includes(r.status)).length,
  };

  const tabs = [
    { value: "new", label: t("tutor_request.tab_new", "New") },
    { value: "waiting", label: t("tutor_request.tab_waiting", "Awaiting") },
    { value: "schedule", label: t("tutor_request.tab_schedule", "Needs schedule") },
    { value: "active", label: t("tutor_request.tab_active", "Active") },
    { value: "archive", label: t("tutor_request.tab_archive", "Archive") },
  ];

  const visible = requests.filter((r) => (TUTOR_TABS[tab] || []).includes(r.status));
  const hasAny = requests.length > 0;

  const getStudentId = (r) => r.student_id || r.student?.id || null;

  return (
    <>
      <div className="section-head">
        <h2>{t("tutor_request.title", "Requests")}</h2>
        {counts.new > 0 && (
          <span className="badge badge-new">
            {t("tutor_request.new_count", "{{count}} new", { count: counts.new })}
          </span>
        )}
      </div>

      <Tabs items={tabs} active={tab} onChange={setTab} id="tutor-requests-tabs" />

      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !hasAny ? (
        <EmptyState title={t("tutor_request.empty_all", "Nothing here")} />
      ) : visible.length === 0 ? (
        <EmptyState title={t("tutor_request.empty_tab", "Nothing in this tab")} hint={t("tutor_request.empty_tab_hint", "Check other tabs")} />
      ) : (
        <div className="bookings-list">
          {visible.map((r) => (
            <div key={r.id} className="booking-card">
              <Link to={`/tutor/requests/${r.id}`} className="booking-info-link">
                <div className="booking-info">
                  <h3>{r.student_name || r.student?.full_name || t("profile.full_name", "Student")}</h3>
                  <p>{r.course_title || r.course?.title}</p>
                  <p className="booking-time">
                    <Badge status={r.status}>{applicationStatusLabel(r.status, t)}</Badge>
                  </p>
                  {r.preferred_schedule && <p className="booking-meta">{r.preferred_schedule}</p>}
                  {r.message && <p className="booking-meta">{r.message}</p>}
                </div>
              </Link>
              <div className="booking-actions">
                {canAssignSchedule(r.status) && (
                  <button className="btn-primary" onClick={() => setScheduleTarget(r)}>
                    {t("tutor_request.assign_schedule", "Assign schedule")}
                  </button>
                )}
                {canReschedule(r.status) && !canAssignSchedule(r.status) && (
                  <button className="btn-secondary" onClick={() => setScheduleTarget(r)}>
                    {t("tutor_request.reschedule", "Change schedule")}
                  </button>
                )}
                {r.status === ENROLLMENT_STATUS.SCHEDULED && (
                  <Link to="/tutor/schedule" className="btn-primary">
                    {t("navbar.schedule", "Schedule")}
                  </Link>
                )}
                {canTutorMessage(r.status) && (
                  <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "TUTOR", getStudentId(r))}>
                    {t("tutor_request.message_student", "Message student")}
                  </button>
                )}
                <Link to={`/tutor/requests/${r.id}`} className="btn-secondary">
                  {t("request_detail.view_schedule", "Details")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {scheduleTarget && (
        <ScheduleModal
          enrollment={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onSuccess={() => {
            toast.success(t("success.action_completed", "Action completed"));
            setScheduleTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}

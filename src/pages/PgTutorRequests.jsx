import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { enrollmentsApi } from "../api/students.api";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { Tabs } from "../components/ui/Tabs";
import ScheduleModal from "../components/ScheduleModal";
import { useToast } from "../components/ui/Toast";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { applicationStatusLabel } from "../utils/statusLabels";
import "../styles/Dashboard.css";
import "../styles/overlay.css";

const TAB_STATUS = {
  new: [ENROLLMENT_STATUS.PENDING],
  waiting: [ENROLLMENT_STATUS.ACCEPTED],
  schedule: [ENROLLMENT_STATUS.SCHEDULE_PENDING, ENROLLMENT_STATUS.SCHEDULE_PROPOSED],
  active: [ENROLLMENT_STATUS.SCHEDULED],
  archive: [ENROLLMENT_STATUS.REJECTED, ENROLLMENT_STATUS.CANCELLED, ENROLLMENT_STATUS.COMPLETED],
};

export default function PgTutorRequests() {
  const { t } = useTranslation();
  const toast = useToast();
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

  const newCount = requests.filter((r) => TAB_STATUS.new.includes(r.status)).length;
  const tabs = [
    { value: "new", label: t("tutor_request.tab_new") },
    { value: "waiting", label: t("tutor_request.tab_waiting") },
    { value: "schedule", label: t("tutor_request.tab_schedule") },
    { value: "active", label: t("tutor_request.tab_active") },
    { value: "archive", label: t("tutor_request.tab_archive") },
  ];

  const visible = requests.filter((r) => (TAB_STATUS[tab] || []).includes(r.status));

  return (
    <>
      <div className="section-head">
        <h2>{t("tutor_request.title", "Requests")}</h2>
        {newCount > 0 && (
          <span className="badge badge-new">
            {t("tutor_request.new_count", "{{count}} new", { count: newCount })}
          </span>
        )}
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} id="tutor-requests-tabs" />

      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="📨"
          title={tab === "new" ? t("tutor_request.empty_new", "No new requests") : t("tutor_request.empty_all", "Nothing here")}
        />
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
                  {r.preferred_schedule && <p className="booking-meta">🕐 {r.preferred_schedule}</p>}
                  {r.message && <p className="booking-meta">«{r.message}»</p>}
                </div>
              </Link>
              <div className="booking-actions">
                {(r.status === ENROLLMENT_STATUS.PENDING || r.status === ENROLLMENT_STATUS.ACCEPTED) && (
                  <>
                    <button className="btn-primary" onClick={() => setScheduleTarget(r)}>
                      {t("tutor_request.accept", "Accept")}
                    </button>
                    <Link to={`/tutor/requests/${r.id}`} className="btn-secondary">
                      {t("request_detail.view_schedule", "Details")}
                    </Link>
                  </>
                )}
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

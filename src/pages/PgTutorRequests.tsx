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
import type { EnrollmentDTO } from "../types/api";
import "../styles/Dashboard.css";
import "../styles/overlay.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toList(data: unknown): EnrollmentDTO[] {
  if (Array.isArray(data)) return data as EnrollmentDTO[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as EnrollmentDTO[];
  return [];
}

export default function PgTutorRequests(): JSX.Element {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const setPageTitle = usePageTitle();
  const [requests, setRequests] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [tab, setTab] = useState<string>("new");
  const [scheduleTarget, setScheduleTarget] = useState<EnrollmentDTO | null>(null);

  useEffect(() => { setPageTitle(t("tutor_request.title", "Requests") as string); }, [setPageTitle, t]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await enrollmentsApi.tutorRequests();
      if (response.ok) {
        setRequests(toList(data));
      } else {
        const rec = isRecord(data) ? (data as Record<string, unknown>) : null;
        const msg = (rec?.["message"] as string | undefined) ?? (rec?.["error"] as string | undefined) ?? t("common.error", "Error") as string;
        setError(msg);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const counts = {
    new: requests.filter((r) => (TUTOR_TABS.new as string[]).includes(r.status)).length,
    waiting: requests.filter((r) => (TUTOR_TABS.waiting as string[]).includes(r.status)).length,
    schedule: requests.filter((r) => (TUTOR_TABS.schedule as string[]).includes(r.status)).length,
    active: requests.filter((r) => (TUTOR_TABS.active as string[]).includes(r.status)).length,
    archive: requests.filter((r) => (TUTOR_TABS.archive as string[]).includes(r.status)).length,
  };

  const tabs = [
    { value: "new", label: t("tutor_request.tab_new", "New") as string },
    { value: "waiting", label: t("tutor_request.tab_waiting", "Awaiting") as string },
    { value: "schedule", label: t("tutor_request.tab_schedule", "Needs schedule") as string },
    { value: "active", label: t("tutor_request.tab_active", "Active") as string },
    { value: "archive", label: t("tutor_request.tab_archive", "Archive") as string },
  ];

  const visible = requests.filter((r) => ((TUTOR_TABS[tab] as string[] | undefined) ?? []).includes(r.status));
  const hasAny = requests.length > 0;

  const getStudentId = (r: EnrollmentDTO): string | number | null => {
    const rec = r as unknown as Record<string, unknown>;
    if (rec["student_id"]) return rec["student_id"] as string | number;
    const student = rec["student"] as Record<string, unknown> | undefined;
    if (student?.["id"]) return student["id"] as string | number;
    return null;
  };

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
        <Spinner label={t("common.loading", "Loading...") as string} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !hasAny ? (
        <EmptyState title={t("tutor_request.empty_all", "Nothing here") as string} />
      ) : visible.length === 0 ? (
        <EmptyState title={t("tutor_request.empty_tab", "Nothing in this tab") as string} hint={t("tutor_request.empty_tab_hint", "Check other tabs") as string} />
      ) : (
        <div className="bookings-list">
          {visible.map((r) => {
            const rec = r as unknown as Record<string, unknown>;
            const student = rec["student"] as Record<string, unknown> | undefined;
            const course = rec["course"] as Record<string, unknown> | undefined;
            return (
            <div key={String(r.id)} className="booking-card">
              <Link to={`/tutor/requests/${r.id}`} className="booking-info-link">
                <div className="booking-info">
                  <h3>{(r.student_name as string) || (student?.["full_name"] as string | undefined) || (t("profile.full_name", "Student") as string)}</h3>
                  <p>{(r.course_title as string) || (course?.["title"] as string | undefined) || ""}</p>
                  <p className="booking-time">
                    <Badge status={r.status}>{applicationStatusLabel(r.status, t as (k: string, f: string) => string)}</Badge>
                    <span className="status-hint" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", display: "block", marginTop: 4 }}>{t(`status_hint.${r.status}`, "")}</span>
                  </p>
                  {r.preferred_schedule && <p className="booking-meta">{r.preferred_schedule as string}</p>}
                  {r.message && <p className="booking-meta">{r.message as string}</p>}
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
          )})}
        </div>
      )}

      {scheduleTarget && (
        <ScheduleModal
          enrollment={scheduleTarget as unknown as never}
          onClose={() => setScheduleTarget(null)}
          onSuccess={() => {
            toast.success(t("success.action_completed", "Action completed") as string);
            setScheduleTarget(null);
            void load();
          }}
        />
      )}
    </>
  );
}

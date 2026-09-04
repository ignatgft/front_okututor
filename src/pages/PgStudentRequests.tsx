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
import type { EnrollmentDTO } from "../types/api";
import "../styles/Dashboard.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toList(data: unknown): EnrollmentDTO[] {
  if (Array.isArray(data)) return data as EnrollmentDTO[];
  if (isRecord(data) && Array.isArray(data["content"])) return data["content"] as EnrollmentDTO[];
  return [];
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (isRecord(err) && typeof err["message"] === "string") return err["message"] as string;
  return fallback;
}

export default function PgStudentRequests(): JSX.Element {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [cancelTarget, setCancelTarget] = useState<EnrollmentDTO | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [tab, setTab] = useState<string>("awaiting");
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("student_requests.title", "My Requests") as string); }, [setPageTitle, t]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await studentsApi.myEnrollments();
      if (response.ok) {
        setEnrollments(toList(data));
      } else {
        const rec = isRecord(data) ? (data as Record<string, unknown>) : null;
        const msg = (rec?.["message"] as string | undefined) ?? (rec?.["error"] as string | undefined) ?? t("common.error", "Error") as string;
        setError(msg);
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e, t("common.error", "Error") as string));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = [
    { value: "awaiting", label: t("student_requests.tab_awaiting", "Awaiting") as string },
    { value: "action", label: t("student_requests.tab_action", "Action needed") as string },
    { value: "active", label: t("student_requests.tab_active", "Active") as string },
    { value: "archive", label: t("student_requests.tab_archive", "Archive") as string },
  ];

  const visible = enrollments.filter((e) => (STUDENT_TABS[tab] ?? []).includes(e.status as never));
  const hasAny = enrollments.length > 0;

  const handleCancel = async (): Promise<void> => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await studentsApi.cancelEnrollment(String(cancelTarget.id));
      toast.success(t("student_requests.cancel_success", "Request cancelled") as string);
      setCancelTarget(null);
      await load();
    } catch (e2: unknown) {
      toast.error(getErrorMessage(e2, t("errors.default", "Something went wrong.") as string));
    } finally {
      setActionLoading(false);
    }
  };

  const getTeacherId = (e: EnrollmentDTO): string | number | null => {
    const rec = e as unknown as Record<string, unknown>;
    if (rec["teacher_id"]) return rec["teacher_id"] as string | number;
    const teacher = rec["teacher"] as Record<string, unknown> | undefined;
    if (teacher?.["id"]) return teacher["id"] as string | number;
    const course = rec["course"] as Record<string, unknown> | undefined;
    if (course?.["teacher_id"]) return course["teacher_id"] as string | number;
    return null;
  };

  return (
    <>
      <Tabs items={tabs} active={tab} onChange={setTab} id="student-requests-tabs" />
      {loading ? (
        <Spinner label={t("common.loading", "Loading...") as string} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !hasAny ? (
        <EmptyState
          title={t("student_requests.empty", "No requests yet") as string}
          hint={
            <Link to="/student/search" className="btn-primary">
              {t("dashboard.find_tutors", "Find Tutors")}
            </Link>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t("student_requests.empty_tab", "Nothing in this tab") as string}
          hint={t("student_requests.empty_tab_hint", "Check other tabs — you have requests elsewhere.") as string}
        />
      ) : (
        <div className="bookings-list">
          {visible.map((e2) => {
            const rec = e2 as unknown as Record<string, unknown>;
            const course = rec["course"] as Record<string, unknown> | undefined;
            return (
            <div key={String(e2.id)} className="booking-card">
              <Link to={`/student/requests/${e2.id}`} className="booking-info-link">
                <div className="booking-info">
                  <h3>{(e2.course_title as string) || (course?.["title"] as string | undefined) || ""}</h3>
                  <p>{(e2 as unknown as Record<string, unknown>)["teacher_name"] as string | undefined ?? (course?.["teacher_name"] as string | undefined) ?? ""}</p>
                  {e2.created_at && (
                    <p className="booking-time">{new Date(e2.created_at as string).toLocaleDateString()}</p>
                  )}
                </div>
              </Link>
              <div className="booking-actions">
                <Badge status={e2.status}>{enrollmentStatusLabel(e2.status, t as (k: string, f: string) => string)}</Badge>
                <span className="status-hint" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", display: "block", marginTop: 4 }}>{t(`status_hint.${e2.status}`, "")}</span>
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
                  <Link to={e2.course_id || course?.["id"] ? `/course/${e2.course_id || course?.["id"]}` : "/student/courses"} className="btn-primary">
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
          )})}
        </div>
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        title={t("student_requests.cancel_title", "Cancel request?") as string}
        message={t(
          "student_requests.cancel_message",
          "Your request to join \"{{course}}\" will be withdrawn.",
          { course: (cancelTarget as unknown as Record<string, unknown> | null)?.["course_title"] as string ?? (cancelTarget as unknown as Record<string, unknown> | null)?.["course"] as Record<string, unknown> | undefined ? ((cancelTarget as unknown as Record<string, unknown>)["course"] as Record<string, unknown>)["title"] as string : "" }
        ) as string}
        confirmLabel={t("common.cancel_request", "Cancel") as string}
        loading={actionLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </>
  );
}

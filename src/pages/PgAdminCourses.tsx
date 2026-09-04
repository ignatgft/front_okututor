// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { adminApi } from "../api/admin.api";
import ConfirmModal from "../components/ui/ConfirmModal";
import ReasonModal from "../components/ui/ReasonModal";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import { COURSE_STATUS } from "../constants/enums";
import "../styles/Admin.css";

export default function PgAdminCourses() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminApi.courses(statusFilter);
      if (response.ok) {
        setCourses(Array.isArray(data) ? data : data.content || []);
      } else {
        setError(data.message || data.error || t("common.error"));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await adminApi.approveCourse(approveTarget.id);
      toast.success(t("admin.course_approved", "Course published successfully"));
      setApproveTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await adminApi.rejectCourse(rejectTarget.id, reason);
      toast.success(t("admin.course_rejected", "Course rejected"));
      setRejectTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => { setPageTitle(t("admin.course_moderation", "Course moderation")); }, [setPageTitle, t]);

  return (
    <>
      <div className="dashboard-tabs">
        {[
          ["", t("dashboard.all", "All")],
          [COURSE_STATUS.PENDING, t("admin.pending", "Pending")],
          [COURSE_STATUS.PUBLISHED, t("admin.published", "Published")],
          [COURSE_STATUS.REJECTED, t("admin.rejected", "Rejected")],
          [COURSE_STATUS.ARCHIVED, t("admin.archived", "Archived")],
        ].map(([value, label]) => (
          <button
            key={value || "all"}
            type="button"
            className={`tab-btn ${statusFilter === value ? "active" : ""}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label={t("common.loading")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : courses.length === 0 ? (
        <EmptyState title={t("admin.no_courses_found", "No courses found")} />
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>{t("cr_course.name", "Title")}</th>
                <th>{t("course.tutor", "Tutor")}</th>
                <th>{t("admin.status", "Status")}</th>
                <th>{t("admin.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/course/${c.id}`} className="btn-link">
                      {c.title}
                    </Link>
                  </td>
                  <td>{c.teacher_name || c.teacherName || c.teacher?.full_name}</td>
                  <td><Badge status={c.status}>{c.status || "—"}</Badge></td>
                  <td className="actions-cell">
                    {(!c.status || c.status === COURSE_STATUS.PENDING) && (
                      <>
                        <button className="btn-primary" onClick={() => setApproveTarget(c)}>
                          {t("admin.approve", "Approve")}
                        </button>
                        <button className="btn-danger" onClick={() => setRejectTarget(c)}>
                          {t("admin.reject", "Reject")}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!approveTarget}
        title={t("admin.approve_course_title", "Publish course?")}
        message={t("admin.approve_course_message", "\"{{title}}\" will become visible to all students.", {
          title: approveTarget?.title || "",
        })}
        confirmLabel={t("admin.approve", "Approve")}
        loading={actionLoading}
        onCancel={() => setApproveTarget(null)}
        onConfirm={approve}
      />
      <ReasonModal
        isOpen={!!rejectTarget}
        title={t("admin.reject_course_title", "Reject course?")}
        loading={actionLoading}
        onCancel={() => setRejectTarget(null)}
        onConfirm={reject}
      />
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../components/pageTitleContext";
import { adminApi } from "../api/admin.api";
import ConfirmModal from "../components/ui/ConfirmModal";
import ReasonModal from "../components/ui/ReasonModal";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import { TUTOR_STATUS } from "../constants/enums";
import "../styles/Admin.css";

function ApplicationDrawer({ application, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const Field = ({ label, value }) => (
    <div className="admin-app-field">
      <span className="admin-app-label">{label}</span>
      <span className="admin-app-value">{value || "—"}</span>
    </div>
  );

  return (
    <div className="admin-drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="admin-drawer" role="dialog" aria-modal="true" aria-label={t("admin.application_detail", "Application details")}>
        <div className="admin-drawer-header">
          <h2>{t("admin.application_detail", "Application details")}</h2>
          <button type="button" className="admin-drawer-close" onClick={onClose} aria-label={t("common.close", "Close")}>
            ✕
          </button>
        </div>

        <div className="admin-drawer-body">
          <Field label={t("admin.name", "Name")} value={application.full_name || application.user?.full_name} />
          <Field label={t("admin.email", "Email")} value={application.email || application.user?.email} />
          <Field label={t("admin.phone", "Phone")} value={application.phone} />
          <Field label={t("course.subject", "Subject")} value={application.subjects} />
          <Field label={t("become_tutor.step_languages", "Languages")} value={application.languages?.join?.(", ") || application.languages} />
          <Field label={t("admin.location", "Location")} value={application.location} />
          <Field label={t("cr_course.experience_label", "Years of experience")} value={application.experience_years} />
          <Field label={t("become_tutor.experience_desc", "Describe your teaching experience")} value={application.experience_description} />
          <Field label={t("become_tutor.education", "University / degrees / certificates")} value={application.education} />
          <Field label={t("admin.status", "Status")} value={application.status} />
          {application.created_at && (
            <Field label={t("common.submitted", "Submitted")} value={new Date(application.created_at).toLocaleDateString()} />
          )}
          {application.rejection_reason && (
            <Field label={t("tutor_application.rejection_reason", "Reason")} value={application.rejection_reason} />
          )}
        </div>

        <div className="admin-drawer-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/messages")}
          >
            {t("admin.chat_with_applicant", "Chat with applicant")}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function PgAdminTutors() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminApi.tutorApplications(statusFilter);
      if (response.ok) {
        setApplications(Array.isArray(data) ? data : data.content || []);
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
      await adminApi.approveTutor(approveTarget.id);
      toast.success(t("admin.tutor_approved", "Tutor approved successfully"));
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
      await adminApi.rejectTutor(rejectTarget.id, reason);
      toast.success(t("admin.tutor_rejected", "Tutor application rejected"));
      setRejectTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => { setPageTitle(t("admin.tutor_applications", "Tutor applications")); }, [setPageTitle, t]);

  return (
    <>
      <div className="dashboard-tabs">
        {[
          ["", t("dashboard.all", "All")],
          [TUTOR_STATUS.PENDING, t("tutor_application.pending", "Pending")],
          [TUTOR_STATUS.APPROVED, t("admin.approved", "Approved")],
          [TUTOR_STATUS.REJECTED, t("admin.rejected", "Rejected")],
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
      ) : applications.length === 0 ? (
        <EmptyState title={t("admin.no_applications", "No applications found")} />
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>{t("admin.name", "Name")}</th>
                <th>{t("admin.email", "Email")}</th>
                <th>{t("course.subject", "Subject")}</th>
                <th>{t("admin.status", "Status")}</th>
                <th>{t("admin.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="admin-app-row" onClick={() => setDetail(a)}>
                  <td>{a.full_name || a.user?.full_name}</td>
                  <td>{a.email || a.user?.email}</td>
                  <td>{a.subjects}</td>
                  <td><Badge status={a.status}>{a.status}</Badge></td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    {a.status !== TUTOR_STATUS.APPROVED && (
                      <button className="btn-primary" onClick={() => setApproveTarget(a)}>
                        {t("admin.approve", "Approve")}
                      </button>
                    )}
                    {a.status !== TUTOR_STATUS.REJECTED && (
                      <button className="btn-danger" onClick={() => setRejectTarget(a)}>
                        {t("admin.reject", "Reject")}
                      </button>
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
        title={t("admin.approve_title", "Approve application?")}
        message={t("admin.approve_message", "{{name}} will become a verified tutor.", {
          name: approveTarget?.full_name || approveTarget?.user?.full_name || "",
        })}
        confirmLabel={t("admin.approve", "Approve")}
        loading={actionLoading}
        onCancel={() => setApproveTarget(null)}
        onConfirm={approve}
      />
      <ReasonModal
        isOpen={!!rejectTarget}
        title={t("admin.reject_title", "Reject application?")}
        loading={actionLoading}
        onCancel={() => setRejectTarget(null)}
        onConfirm={reject}
      />
      {detail && <ApplicationDrawer application={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

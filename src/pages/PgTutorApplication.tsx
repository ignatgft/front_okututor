// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { tutorsApi } from "../api/tutors.api";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { TUTOR_STATUS } from "../constants/enums";
import "../styles/Dashboard.css";

const STATUS_ICONS = {
  PENDING: "⏳",
  APPROVED: "✅",
  REJECTED: "❌",
  SUSPENDED: "🚫",
};

export default function PgTutorApplication() {
  const { t } = useTranslation();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("tutor_application.title", "Tutor application")); }, [setPageTitle, t]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await tutorsApi.myApplication();
      if (response.ok && data && Object.keys(data).length > 0) {
        setApplication(data);
      } else {
        setApplication(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !application ? (
        <EmptyState
          icon="📋"
          title={t("tutor_application.no_application", "You haven't applied yet")}
          hint={
            <Link to="/become-tutor" className="btn-primary">
              {t("become_tutor.title", "Become a tutor")}
            </Link>
          }
        />
      ) : (
        <div className="booking-card">
          <div className="booking-info">
            <h3>
              {STATUS_ICONS[application.status] || "📄"}{" "}
              {application.status === TUTOR_STATUS.PENDING && t("tutor_application.pending", "Under review")}
              {application.status === TUTOR_STATUS.APPROVED && t("tutor_application.approved", "Approved! Welcome aboard 🎉")}
              {application.status === TUTOR_STATUS.REJECTED && t("tutor_application.rejected", "Application rejected")}
              {application.status === TUTOR_STATUS.SUSPENDED && t("tutor_application.suspended", "Account suspended")}
            </h3>
            <p>{t("common.submitted", "Submitted")}: {application.created_at ? new Date(application.created_at).toLocaleDateString() : "—"}</p>
            {application.subjects && <p>{t("course.subject", "Subject")}: {application.subjects}</p>}
            {application.languages && <p>{t("become_tutor.languages", "Languages")}: {application.languages}</p>}
          </div>
          <Badge status={application.status}>{application.status}</Badge>
        </div>
      )}

      {application?.status === TUTOR_STATUS.REJECTED && application.rejection_reason && (
        <div className="pending-section">
          <h2>{t("tutor_application.rejection_reason", "Reason")}</h2>
          <p>{application.rejection_reason}</p>
          <Link to="/become-tutor" className="btn-primary">
            {t("tutor_application.apply_again", "Apply again")}
          </Link>
        </div>
      )}

      {application?.status === TUTOR_STATUS.APPROVED && (
        <Link to="/tutor/courses/create" className="btn-primary">
          {t("tutor_dashboard.create_course", "Create Course")}
        </Link>
      )}
    </>
  );
}

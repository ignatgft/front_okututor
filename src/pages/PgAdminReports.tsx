// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { adminApi } from "../api/admin.api";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import { REPORT_STATUS } from "../constants/enums";
import "../styles/Admin.css";

export default function PgAdminReports() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminApi.reports();
      if (response.ok) setReports(Array.isArray(data) ? data : data.content || []);
      else setError(data.message || data.error || t("common.error"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (report, status) => {
    setActionLoading(report.id);
    try {
      await adminApi.updateReport(report.id, { status });
      await load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => { setPageTitle(t("admin.reports", "Reports")); }, [setPageTitle, t]);

  return (
    <>
      {loading ? (
        <Spinner label={t("common.loading")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : reports.length === 0 ? (
        <EmptyState icon="🚩" title={t("admin.no_reports", "No reports")} />
      ) : (
        <div className="bookings-list">
          {reports.map((r) => (
            <div key={r.id} className="booking-card">
              <div className="booking-info">
                <h3>
                  {r.type} · {r.subject_type || r.target_type || "—"} #{r.target_id || "—"}
                </h3>
                <p>{r.reason || r.description}</p>
                <p className="booking-time">
                  {t("admin.reported_by", "Reported by")}: {r.reporter_name || r.reporter?.full_name || "—"}
                </p>
              </div>
              <div className="booking-actions">
                <Badge status={r.status}>{r.status}</Badge>
                {r.status !== REPORT_STATUS.RESOLVED && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={actionLoading === r.id}
                    onClick={() => updateStatus(r, REPORT_STATUS.RESOLVED)}
                  >
                    {t("admin.resolve", "Resolve")}
                  </button>
                )}
                {r.status === REPORT_STATUS.OPEN && (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={actionLoading === r.id}
                    onClick={() => updateStatus(r, REPORT_STATUS.IN_REVIEW)}
                  >
                    {t("admin.mark_in_review", "In review")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { adminApi } from "../api/admin.api";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Badge, Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/Admin.css";

export default function PgAdminReviews() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminApi.reviews();
      if (response.ok) setReviews(Array.isArray(data) ? data : data.content || []);
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

  const toggleHidden = async () => {
    if (!confirmTarget) return;
    setActionLoading(confirmTarget.id);
    try {
      if (confirmTarget.hidden) await adminApi.restoreReview(confirmTarget.id);
      else await adminApi.hideReview(confirmTarget.id);
      toast.success(confirmTarget.hidden
        ? t("admin.restore_success", "Review restored")
        : t("admin.hide_success", "Review hidden")
      );
      setConfirmTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => { setPageTitle(t("admin.reviews_moderation", "Reviews moderation")); }, [setPageTitle, t]);

  return (
    <>
      {loading ? (
        <Spinner label={t("common.loading")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : reviews.length === 0 ? (
        <EmptyState title={t("admin.no_reviews", "No reviews found")} />
      ) : (
        <div className="bookings-list">
          {reviews.map((r) => (
            <div key={r.id} className="booking-card">
              <div className="booking-info">
                <h3>
                  {"★".repeat(Number(r.rating) || 0)}
                  {"☆".repeat(Math.max(0, 5 - (Number(r.rating) || 0)))}
                  {r.hidden && <Badge status="HIDDEN">{t("admin.hidden", "hidden")}</Badge>}
                </h3>
                <p>{r.comment}</p>
                <p className="booking-time">
                  {r.student_name || r.student?.full_name}
                  {r.course_title && <> · <Link to={`/course/${r.course_id}`}>{r.course_title}</Link></>}
                </p>
              </div>
              <button
                type="button"
                className={r.hidden ? "btn-primary" : "btn-danger"}
                onClick={() => setConfirmTarget(r)}
                disabled={actionLoading === r.id}
              >
                {r.hidden ? t("admin.restore", "Restore") : t("admin.hide", "Hide")}
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmTarget}
        title={confirmTarget?.hidden
          ? t("admin.restore_review_title", "Restore review?")
          : t("admin.hide_review_title", "Hide review?")
        }
        message={confirmTarget?.hidden
          ? t("admin.restore_review_message", "This review will become visible to all users.")
          : t("admin.hide_review_message", "This review will be hidden from public view.")
        }
        confirmLabel={confirmTarget?.hidden
          ? t("admin.restore", "Restore")
          : t("admin.hide", "Hide")
        }
        loading={!!actionLoading}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={toggleHidden}
      />
    </>
  );
}

// Admin metrics page — platform KPIs (users, lessons, revenue).
// Data comes from /api/v1/admin/metrics/*; falls back to admin stats
// when the metrics endpoints are not yet deployed.
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../api/admin.api";
import { apiClient } from "../api/http";
import { endpoints } from "../api/endpoints";
import { usePageTitle } from "../components/pageTitleContext";
import { ErrorState, Skeleton } from "../components/ui/Primitives";
import MetricCard from "../components/ui/MetricCard";
import { isRecord } from "../utils/apiHelpers";
import "../styles/Admin.css";

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PgAdminMetrics() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const [overview, setOverview] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageTitle(t("admin.metrics", "Metrics"));
  }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminApi.metricsOverview();
      if (response.ok && isRecord(data)) {
        setOverview(data);
      } else if (response.status === 404) {
        // Metrics API not deployed yet — degrade gracefully to base stats.
        const fallback = await apiClient.get(endpoints.admin.stats);
        setOverview(isRecord(fallback.data) ? fallback.data : {});
      } else {
        const msg = isRecord(data) ? (data["message"] ?? data["error"]) : undefined;
        setError(typeof msg === "string" && msg ? msg : t("errors.default", "Something went wrong."));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const cards: { key: string; label: string; value: number; icon: string }[] = [
    { key: "total_users", label: t("admin.users", "Users"), value: num(overview["total_users"]), icon: "👥" },
    { key: "total_students", label: t("admin.metrics.students", "Students"), value: num(overview["total_students"]), icon: "🎓" },
    { key: "total_tutors", label: t("admin.metrics.tutors", "Tutors"), value: num(overview["total_tutors"]), icon: "🧑‍🏫" },
    { key: "total_courses", label: t("tutor_dashboard.courses", "Courses"), value: num(overview["total_courses"]), icon: "📚" },
    { key: "total_lessons", label: t("admin.metrics.lessons", "Lessons"), value: num(overview["total_lessons"] ?? overview["total_bookings"]), icon: "🗓️" },
    { key: "total_reviews", label: t("course.reviews", "Reviews"), value: num(overview["total_reviews"]), icon: "⭐" },
    { key: "active_users", label: t("admin.metrics.active_users", "Active (24h)"), value: num(overview["active_users"]), icon: "🟢" },
    { key: "revenue_total", label: t("admin.metrics.revenue", "Revenue"), value: num(overview["revenue_total"]), icon: "💰" },
  ];

  return (
    <>
      {loading ? (
        <Skeleton count={4} className="skeleton-card" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="stats-grid">
          {cards.map((c) => (
            <MetricCard
              key={c.key}
              label={c.label}
              value={c.value.toLocaleString()}
              icon={<span aria-hidden="true">{c.icon}</span>}
              tone="info"
            />
          ))}
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../components/pageTitleContext";
import { notificationsApi } from "../api/messages.api";
import { Spinner, EmptyState, ErrorState, Badge } from "../components/ui/Primitives";

const typeKeys = {
  COURSE_APPLICATION: "notifications.types.COURSE_APPLICATION",
  APPLICATION_ACCEPTED: "notifications.types.APPLICATION_ACCEPTED",
  APPLICATION_REJECTED: "notifications.types.APPLICATION_REJECTED",
  BOOKING_CONFIRMED: "notifications.types.BOOKING_CONFIRMED",
  BOOKING_CANCELLED: "notifications.types.BOOKING_CANCELLED",
  SYSTEM: "notifications.types.SYSTEM",
};

export default function PgNotifications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setPageTitle = usePageTitle();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { setPageTitle(t("notifications.title", "Notifications")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await notificationsApi.list();
      if (response.ok) setItems(Array.isArray(data) ? data : data.content || []);
      else setError(data.message || data.error || t("common.error", "Error"));
    } catch (e) {
      setError(e.message || t("errors.default", "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    try {
      const { response } = await notificationsApi.markAllRead();
      if (!response.ok) {
        setError(t("errors.default", "Something went wrong"));
        return;
      }
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notifications:refresh"));
    } catch (err) {
      setError(err.message || t("errors.default", "Something went wrong"));
    }
  };

  const open = async (n) => {
    if (!n.read) {
      try {
        await notificationsApi.markRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      } catch {
        // continue to navigate even if read fails
      }
    }
    if (n.link) {
      navigate(n.link);
    } else if (n.payload?.booking_id) {
      navigate(`/lesson/${n.payload.booking_id}`);
    } else if (n.payload?.enrollment_id) {
      navigate(`/student/courses`);
    }
  };

  const formatScheduledAt = (n) => {
    const raw = n.payload?.scheduled_at || n.scheduled_at;
    if (!raw) return null;
    try {
      const d = new Date(raw);
      return d.toLocaleString(i18n.language);
    } catch {
      return raw;
    }
  };

  const renderTitle = (n) => {
    const typeLabel = typeKeys[n.type] ? t(typeKeys[n.type]) : n.type;
    return (
      <>
        <span className="notification-type">{typeLabel}</span>
        {n.message && <span className="notification-message">{n.message || n.text}</span>}
        {formatScheduledAt(n) && (
          <span className="notification-date">{formatScheduledAt(n)}</span>
        )}
      </>
    );
  };

  return (
    <div className="pending-section">
      <div className="section-header-row">
        <h2>{t("notifications.title", "Notifications")}</h2>
        <button className="btn-secondary" onClick={markAll}>
          {t("notifications.mark_all", "Mark all as read")}
        </button>
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title={t("notifications.empty", "No notifications yet")} />
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="notifications-list">
          {items.map((n) => (
            <li key={n.id} className={`notification-item ${n.read ? "" : "unread"}`}>
              <div className="notification-body">
                {renderTitle(n)}
                {n.created_at && (
                  <span className="notification-date">
                    {new Date(n.created_at).toLocaleString(i18n.language)}
                  </span>
                )}
              </div>
              {!n.read && <Badge status="NEW" />}
              {n.type === "APPLICATION_ACCEPTED" ? (
                <button className="btn-secondary" onClick={() => open(n)}>
                  {t("notifications.open_schedule", "Open schedule")}
                </button>
              ) : n.link ? (
                <Link className="btn-secondary" to={n.link} onClick={() => open(n)}>
                  {t("notifications.open", "Open")}
                </Link>
              ) : (
                !n.read && (
                  <button className="btn-secondary" onClick={() => open(n)}>
                    {t("common.ok", "OK")}
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

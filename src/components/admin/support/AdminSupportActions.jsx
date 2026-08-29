import { useTranslation } from "react-i18next";
import { TICKET_STATUS, TICKET_PRIORITY } from "../../../constants/support";
import { adminSupportApi } from "../../../api/support.api";

export default function AdminSupportActions({ ticket, onUpdated }) {
  const { t } = useTranslation();

  const handleStatus = async (status) => {
    try {
      await adminSupportApi.updateStatus(ticket.id, status);
      onUpdated?.();
    } catch {
      // noop
    }
  };

  const handlePriority = async (priority) => {
    try {
      await adminSupportApi.updatePriority(ticket.id, priority);
      onUpdated?.();
    } catch {
      // noop
    }
  };

  return (
    <div className="admin-support-actions">
      <div className="admin-support-action-group">
        <label className="admin-support-filter-label">{t("support.status", "Status")}</label>
        <select
          className="admin-support-select"
          value={ticket.status}
          onChange={(e) => handleStatus(e.target.value)}
        >
          {Object.values(TICKET_STATUS).map(s => (
            <option key={s} value={s}>{t(`support.status.${s.toLowerCase()}`, s)}</option>
          ))}
        </select>
      </div>
      <div className="admin-support-action-group">
        <label className="admin-support-filter-label">{t("support.priority", "Priority")}</label>
        <select
          className="admin-support-select"
          value={ticket.priority}
          onChange={(e) => handlePriority(e.target.value)}
        >
          {Object.values(TICKET_PRIORITY).map(p => (
            <option key={p} value={p}>{t(`support.priority.${p.toLowerCase()}`, p)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

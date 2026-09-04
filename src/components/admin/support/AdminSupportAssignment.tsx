// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { adminSupportApi } from "../../../api/support.api";

export default function AdminSupportAssignment({ ticket, onAssigned }: Record<string, unknown>) {
  const { t } = useTranslation();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(ticket?.assigned_admin_id || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminSupportApi.getAgents().then(({ response, data }) => {
      if (response.ok) setAgents(data || []);
    }).catch(() => {});
  }, []);

  const handleAssign = async () => {
    setLoading(true);
    try {
      await adminSupportApi.assign(ticket.id, { admin_id: selectedAgent });
      onAssigned?.();
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const handleTake = async () => {
    setLoading(true);
    try {
      await adminSupportApi.take(ticket.id);
      onAssigned?.();
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-support-assignment">
      <label className="admin-support-filter-label">{t("support.assign_to", "Assign to")}</label>
      <div className="admin-support-assignment-row">
        <select className="admin-support-select" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
          <option value="">{t("support.select_agent", "Select agent...")}</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.full_name}</option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={handleAssign} disabled={loading || !selectedAgent}>
          {t("support.assign", "Assign")}
        </button>
        <button type="button" className="btn-secondary" onClick={handleTake} disabled={loading}>
          {t("support.take_ticket", "Take")}
        </button>
      </div>
    </div>
  );
}

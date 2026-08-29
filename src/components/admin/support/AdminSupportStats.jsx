import { useTranslation } from "react-i18next";

export default function AdminSupportStats({ stats }) {
  const { t } = useTranslation();
  const items = [
    { key: "open", value: stats?.open || 0, label: t("support.status.open", "Open"), cls: "open" },
    { key: "inProgress", value: stats?.inProgress || 0, label: t("support.status.in_progress", "In Progress"), cls: "in-progress" },
    { key: "waiting", value: stats?.waiting || 0, label: t("support.status.waiting", "Waiting"), cls: "waiting" },
    { key: "resolved", value: stats?.resolved || 0, label: t("support.status.resolved", "Resolved"), cls: "resolved" },
    { key: "closed", value: stats?.closed || 0, label: t("support.status.closed", "Closed"), cls: "closed" },
  ];

  return (
    <div className="admin-support-stats">
      {items.map(item => (
        <div key={item.key} className={`admin-support-stat admin-support-stat-${item.cls}`}>
          <span className="admin-support-stat-value">{item.value}</span>
          <span className="admin-support-stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

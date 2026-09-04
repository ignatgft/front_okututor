// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";

export default function SupportFilterBar({ filter, onFilterChange }: Record<string, unknown>) {
  const { t } = useTranslation();
  const filters = [
    { value: "", label: t("support.filter_all", "All") },
    { value: "OPEN", label: t("support.filter_open", "Open") },
    { value: "WAITING_FOR_USER", label: t("support.filter_waiting", "Waiting") },
    { value: "RESOLVED", label: t("support.filter_resolved", "Resolved") },
    { value: "CLOSED", label: t("support.filter_closed", "Closed") },
  ];

  return (
    <div className="support-filter-bar" role="tablist" aria-label={t("support.filter_tickets", "Filter tickets")}>
      {filters.map(f => (
        <button
          key={f.value}
          role="tab"
          aria-selected={filter === f.value}
          className={`support-filter-btn ${filter === f.value ? "support-filter-btn--active" : ""}`}
          onClick={() => onFilterChange(f.value)}
          type="button"
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

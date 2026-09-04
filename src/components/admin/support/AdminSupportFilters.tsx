// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AdminSupportFilters({ filters, onFiltersChange }: Record<string, unknown>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    onFiltersChange({ ...filters, search: val });
  };

  const handleStatus = (status) => {
    onFiltersChange({ ...filters, status });
  };

  const handleCategory = (e) => {
    onFiltersChange({ ...filters, category: e.target.value });
  };

  const handlePriority = (e) => {
    onFiltersChange({ ...filters, priority: e.target.value });
  };

  return (
    <div className="admin-support-filters">
      <div className="admin-support-search">
        <input
          type="search"
          className="admin-support-search-input"
          placeholder={t("support.search_placeholder", "Search by ID, subject, email...")}
          value={search}
          onChange={handleSearch}
          aria-label={t("support.search", "Search tickets")}
        />
      </div>
      <div className="admin-support-filter-row">
        <div className="admin-support-filter-group">
          <label className="admin-support-filter-label">{t("support.status", "Status")}</label>
          <div className="admin-support-filter-tabs" role="tablist">
            {[
              { value: "", label: t("support.filter_all", "All") },
              { value: "OPEN", label: t("support.status.open", "Open") },
              { value: "IN_PROGRESS", label: t("support.status.in_progress", "In Progress") },
              { value: "WAITING_FOR_USER", label: t("support.status.waiting_for_user", "Waiting") },
              { value: "RESOLVED", label: t("support.status.resolved", "Resolved") },
              { value: "CLOSED", label: t("support.status.closed", "Closed") },
            ].map(s => (
              <button
                key={s.value}
                role="tab"
                aria-selected={filters.status === s.value}
                className={`admin-support-filter-tab ${filters.status === s.value ? "admin-support-filter-tab--active" : ""}`}
                onClick={() => handleStatus(s.value)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-support-filter-group">
          <label className="admin-support-filter-label">{t("support.category", "Category")}</label>
          <select className="admin-support-select" value={filters.category || ""} onChange={handleCategory}>
            <option value="">{t("support.filter_all", "All")}</option>
            {["TECHNICAL", "PAYMENT", "ACCOUNT", "LESSON", "COURSE", "TUTOR", "STUDENT", "BUG", "OTHER"].map(c => (
              <option key={c} value={c}>{t(`support.category.${c.toLowerCase()}`, c)}</option>
            ))}
          </select>
        </div>
        <div className="admin-support-filter-group">
          <label className="admin-support-filter-label">{t("support.priority", "Priority")}</label>
          <select className="admin-support-select" value={filters.priority || ""} onChange={handlePriority}>
            <option value="">{t("support.filter_all", "All")}</option>
            {["LOW", "NORMAL", "HIGH", "URGENT"].map(p => (
              <option key={p} value={p}>{t(`support.priority.${p.toLowerCase()}`, p)}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

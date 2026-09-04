// migrated to TSX — minimal strict types (controlled)
import { memo } from "react";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = ["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"];

function CalendarFilters({ value, onChange, disabled = false }: Record<string, unknown>) {
  const { t } = useTranslation();
  return (
    <div className="calendar-filters" role="toolbar" aria-label={t("calendar.filter_status", "Filter by status")}>
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          className={`calendar-filter-btn ${value === s ? "active" : ""}`}
          aria-pressed={value === s}
          onClick={() => onChange(s)}
        >
          {s === "ALL" ? t("calendar.filter_all", "All") : t(`statuses.${s}`, s)}
        </button>
      ))}
    </div>
  );
}

export default memo(CalendarFilters);

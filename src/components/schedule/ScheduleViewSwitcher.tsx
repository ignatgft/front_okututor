import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import type { ScheduleView } from "../../types/schedule";
import "./ScheduleViewSwitcher.css";

interface ScheduleViewSwitcherProps {
  view: ScheduleView;
  onChange: (view: ScheduleView) => void;
}

const VIEWS: { value: ScheduleView; labelKey: string; icon: string }[] = [
  { value: "day", labelKey: "schedule.view_day", icon: "📅" },
  { value: "week", labelKey: "schedule.view_week", icon: "📆" },
  { value: "month", labelKey: "schedule.view_month", icon: "🗓️" },
];

export const ScheduleViewSwitcher = memo(function ScheduleViewSwitcher({ view, onChange }: ScheduleViewSwitcherProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleChange = (newView: ScheduleView) => {
    onChange(newView);
    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set("view", newView);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="schedule-view-switcher" role="tablist" aria-label={t("schedule.view", "Вид")}>
      {VIEWS.map(({ value, labelKey, icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={view === value}
          aria-label={t(labelKey, value)}
          className={`view-btn ${view === value ? "active" : ""}`}
          onClick={() => handleChange(value)}
        >
          <span className="view-btn-icon" aria-hidden="true">{icon}</span>
          <span className="view-btn-label">{t(labelKey, value)}</span>
        </button>
      ))}
    </div>
  );
});

ScheduleViewSwitcher.displayName = "ScheduleViewSwitcher";
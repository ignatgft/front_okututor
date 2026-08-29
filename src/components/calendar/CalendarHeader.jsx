import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

const VIEWS = ["day", "week", "month"];

function CalendarHeader({ view, onChangeView, month, onPrev, onNext, onToday, onPickDate, dateValue, locale = "ru" }) {
  const { t } = useTranslation();
  const title = useMemo(
    () => month.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
    [month, locale]
  );
  const monthTitle = useMemo(
    () => month.toLocaleDateString(locale, { month: "long", year: "numeric" }),
    [month, locale]
  );

  return (
    <>
      <div className="schedule-view-toggle" role="tablist" aria-label={t("schedule.view_day", "View")}>
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            className={`schedule-view-btn ${view === v ? "active" : ""}`}
            onClick={() => onChangeView(v)}
          >
            {t(`schedule.view_${v}`, v)}
          </button>
        ))}
      </div>

      <div className="schedule-header">
        <button type="button" className="schedule-nav-btn" onClick={onPrev} aria-label={t("schedule.prev", "Previous")}>
          ‹
        </button>
        <h2 className="schedule-header-title">{view === "month" ? monthTitle : title}</h2>
        <button type="button" className="schedule-nav-btn" onClick={onNext} aria-label={t("schedule.next", "Next")}>
          ›
        </button>
        <button type="button" className="btn-secondary schedule-today-btn" onClick={onToday}>
          {t("schedule.today", "Today")}
        </button>
      </div>

      <div className="schedule-date-field">
        <label htmlFor="schedule-date">{t("schedule.pick_date", "Pick date")}</label>
        <input
          id="schedule-date"
          type="date"
          value={dateValue}
          onChange={(e) => e.target.value && onPickDate(e.target.value)}
        />
      </div>
    </>
  );
}

export default memo(CalendarHeader);

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import "../../styles/calendar-picker.css";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Попап-календарь для удобного выбора даты вместо нативного type=date.
 * - месяц назад/вперёд
 * - ближайшие даты, совпадающие с выбранными днями недели (быстрые чипы)
 * - «Сегодня» / «Завтра» — быстрые действия
 */
export function CalendarPicker({
  value = "",
  onSelect,
  days = [],
  minDate,
  ariaLabel,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const rootRef = useRef(null);

  const today = startOfDay(new Date());
  const min = minDate ? new Date(`${minDate}T00:00:00`) : today;

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPopup = () => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    setView(base);
    setOpen(true);
  };

  const pick = (iso) => {
    onSelect?.(iso);
    close();
  };

  const shiftMonth = (delta) => {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  };

  const dayNameKey = (name) => `calendar.day_${name}`;

  const quickDates = days.length
    ? buildNextOccurrences(days, today, min)
    : [addDays(today, 0), addDays(today, 1), addDays(today, 2)];

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat(t("calendar.locale", "ru"), { month: "long", year: "numeric" })
    .format(new Date(year, month, 1));

  const weekStart = t("calendar.week_start", "monday") === "sunday" ? 0 : 1;
  const weekdayNames = [...DAY_NAMES.slice(weekStart), ...DAY_NAMES.slice(0, weekStart)];

  const cells = [];
  for (let i = 0; i < (firstWeekday - weekStart + 7) % 7; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="calendar-picker" ref={rootRef}>
      <button type="button" className="calendar-picker-trigger" onClick={openPopup} aria-haspopup="dialog">
        <span className="calendar-picker-value">
          {value ? formatIso(value, t) : t("calendar.choose_date", "Choose a date")}
        </span>
        <span className="calendar-picker-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="calendar-popup" role="dialog" aria-label={ariaLabel || t("calendar.choose_date", "Choose a date")}>
          <div className="calendar-quick">
            <button type="button" className="calendar-quick-chip" onClick={() => pick(toIso(addDays(today, 0)))}>
              {t("calendar.today", "Today")}
            </button>
            <button type="button" className="calendar-quick-chip" onClick={() => pick(toIso(addDays(today, 1)))}>
              {t("calendar.tomorrow", "Tomorrow")}
            </button>
            {quickDates.map((d) => (
              <button
                key={toIso(d)}
                type="button"
                className="calendar-quick-chip"
                onClick={() => pick(toIso(d))}
              >
                {t(`calendar.day_${DAY_NAMES[d.getDay()]}`, d.toLocaleDateString(t("calendar.locale", "ru"), { weekday: "short" }))}
                {" "}
                {d.getDate()}
              </button>
            ))}
          </div>

          <div className="calendar-head">
            <button type="button" className="calendar-nav" onClick={() => shiftMonth(-1)} aria-label={t("calendar.prev_month", "Previous month")}>
              <IoChevronBack />
            </button>
            <span className="calendar-month-label">{capitalize(monthLabel)}</span>
            <button type="button" className="calendar-nav" onClick={() => shiftMonth(1)} aria-label={t("calendar.next_month", "Next month")}>
              <IoChevronForward />
            </button>
          </div>

          <div className="calendar-grid">
            {weekdayNames.map((w) => (
              <span key={w} className="calendar-weekday">
                {t(dayNameKey(w), w.slice(0, 2))}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} className="calendar-cell empty" />;
              const iso = toIso(d);
              const disabled = d < min;
              const isSelected = iso === value;
              const isToday = iso === toIso(today);
              const isRecommended = quickDates.some((q) => toIso(q) === iso);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`calendar-cell ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${isRecommended ? "recommended" : ""}`}
                  disabled={disabled}
                  onClick={() => pick(iso)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function buildNextOccurrences(days, today, min) {
  const wanted = new Set(days.map((d) => String(d).toLowerCase()));
  const result = [];
  let cursor = startOfDay(min < today ? today : min);
  let guard = 0;
  while (result.length < 5 && guard < 60) {
    if (wanted.has(DAY_NAMES[cursor.getDay()])) result.push(new Date(cursor));
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return result;
}

function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  return d;
}

function formatIso(iso, t) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(t("calendar.locale", "ru"), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default CalendarPicker;

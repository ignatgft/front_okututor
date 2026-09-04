import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/calendar-picker.css";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayName = typeof DAY_NAMES[number];

const pad = (n: number): string => String(n).padStart(2, "0");
const toIso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface CalendarPickerProps {
  value?: string;
  onSelect?: (iso: string) => void;
  days?: string[];
  minDate?: string;
  ariaLabel?: string;
}

export function CalendarPicker({
  value = "",
  onSelect,
  days = [],
  minDate,
  ariaLabel,
}: CalendarPickerProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);
  const [view, setView] = useState<Date>(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const rootRef = useRef<HTMLDivElement | null>(null);

  const today = startOfDay(new Date());
  const min = minDate ? new Date(`${minDate}T00:00:00`) : today;

  const close = (): void => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPopup = (): void => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    setView(base);
    setOpen(true);
  };

  const pick = (iso: string): void => {
    onSelect?.(iso);
    close();
  };

  const shiftMonth = (delta: number): void => {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  };

  const dayNameKey = (name: string): string => `calendar.day_${name}`;

  const quickDates = days.length
    ? buildNextOccurrences(days, today, min)
    : [addDays(today, 0), addDays(today, 1), addDays(today, 2)];

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat(t("calendar.locale", "ru") as string, { month: "long", year: "numeric" })
    .format(new Date(year, month, 1));

  const weekStart = (t("calendar.week_start", "monday") as string) === "sunday" ? 0 : 1;
  const weekdayNames = [...DAY_NAMES.slice(weekStart), ...DAY_NAMES.slice(0, weekStart)];

  const cells: (Date | null)[] = [];
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
        <div className="calendar-popup" role="dialog" aria-label={ariaLabel || (t("calendar.choose_date", "Choose a date") as string)}>
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
                {t(`calendar.day_${DAY_NAMES[d.getDay()]}`, d.toLocaleDateString(t("calendar.locale", "ru") as string, { weekday: "short" }))}
                {" "}
                {d.getDate()}
              </button>
            ))}
          </div>

          <div className="calendar-head">
            <button type="button" className="calendar-nav" onClick={() => shiftMonth(-1)} aria-label={t("calendar.prev_month", "Previous month") as string}>
              <ChevronLeft size={18} />
            </button>
            <span className="calendar-month-label">{capitalize(monthLabel)}</span>
            <button type="button" className="calendar-nav" onClick={() => shiftMonth(1)} aria-label={t("calendar.next_month", "Next month") as string}>
              <ChevronRight size={18} />
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

function buildNextOccurrences(days: string[], today: Date, min: Date): Date[] {
  const wanted = new Set(days.map((d) => String(d).toLowerCase()));
  const result: Date[] = [];
  let cursor = startOfDay(min < today ? today : min);
  let guard = 0;
  while (result.length < 5 && guard < 60) {
    if (wanted.has(DAY_NAMES[cursor.getDay()].toLowerCase())) result.push(new Date(cursor));
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return result;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  return d;
}

function formatIso(iso: string, t: (key: string, fallback: string) => string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(t("calendar.locale", "ru") as string, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default CalendarPicker;

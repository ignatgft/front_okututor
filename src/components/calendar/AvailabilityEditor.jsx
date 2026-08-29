import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "../ui/Primitives";
import { useToast } from "../ui/Toast";
import "../../styles/Schedule.css";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_VALUE = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export function AvailabilityEditor({
  availability = [],
  error = "",
  onAdd,
  onRequestRemove,
  onRetry,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ weekday: "Monday", start_time: "18:00", end_time: "22:00" });
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!onAdd) return;
    setBusy(true);
    try {
      const { ok } = await onAdd(form);
      if (!ok) toast.error(t("errors.default", "Something went wrong"));
    } catch (err) {
      toast.error(err.message || t("errors.default", "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="pending-section schedule-availability">
      <h2>{t("schedule.availability", "My availability")}</h2>
      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : availability.length > 0 ? (
        <div className="bookings-list">
          {availability.map((slot) => (
            <div key={slot.id} className="booking-card">
              <div className="booking-info">
                <h3>{t(`days.${String(slot.weekday).toLowerCase()}`, slot.weekday)}</h3>
                <p>{slot.start_time} – {slot.end_time}</p>
              </div>
              <button
                type="button"
                className="btn-danger availability-remove"
                onClick={() => onRequestRemove?.(slot)}
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t("schedule.no_availability", "No availability slots yet")} />
      )}

      <form onSubmit={handleAdd} className="availability-form">
        <select
          value={form.weekday}
          onChange={(e) => setForm((prev) => ({ ...prev, weekday: e.target.value }))}
          aria-label={t("schedule.weekday", "Weekday")}
        >
          {DAY_KEYS.map((k) => (
            <option key={k} value={WEEKDAY_VALUE[k]}>
              {t(`days.${WEEKDAY_VALUE[k].toLowerCase()}`, k)}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={form.start_time}
          onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
          aria-label={t("schedule_modal.time", "Time")}
          required
        />
        <span>–</span>
        <input
          type="time"
          value={form.end_time}
          onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
          aria-label={t("course.time_end", "End time")}
          required
        />
        <button type="submit" className="btn-primary availability-add" disabled={busy}>
          {busy ? t("common.saving", "Saving...") : t("common.add", "Add")}
        </button>
      </form>
    </section>
  );
}

export default AvailabilityEditor;

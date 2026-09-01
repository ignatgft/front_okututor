import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Overlay";
import { CalendarPicker } from "../ui/CalendarPicker";
import { LocationPicker, isValidLocation } from "../LocationPicker";
import { MutualAvailability } from "./MutualAvailability";
import { CalendarWeekOverlay } from "../calendar/CalendarWeekOverlay";
import { generateSlotTimes } from "../../utils/slots";
import { getUserTimezone } from "../../utils/timezone";
import { enrollmentsApi } from "../../api/enrollments.api";
import { scheduleApi, buildProposePayload } from "../../api/schedule.api";
import { getErrorMessage } from "../../utils/errorMessage";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_KEY = {
  monday: "application.days_monday",
  tuesday: "application.days_tuesday",
  wednesday: "application.days_wednesday",
  thursday: "application.days_thursday",
  friday: "application.days_friday",
  saturday: "application.days_saturday",
  sunday: "application.days_sunday",
};
const LESSON_COUNTS = [1, 4, 8, 12, 20];
const DURATIONS = [45, 60, 90];

const TITLES = [
  "schedule_wizard.format",
  "schedule_wizard.location",
  "schedule_wizard.days",
  "schedule_wizard.start_date",
  "schedule_wizard.time",
  "schedule_wizard.count",
  "schedule_wizard.duration",
  "schedule_wizard.review",
];

/**
 * Full schedule creation wizard (spec §3). Steps:
 * Format → Location → Days → Start date → Time → Count → Duration → Review.
 * On submit it confirms & schedules through enrollmentsApi.acceptAndSchedule,
 * including the full schedule preferences for the (future) backend wizard API.
 */
export function ScheduleWizard({
  enrollment,
  course,
  tutorAvailability = [],
  studentInput = {},
  onClose,
  onSuccess,
  submitFn,
  mode = "propose",
}) {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [step, setStep] = useState(0);
  const [format, setFormat] = useState("online");
  const [location, setLocation] = useState(null);
  const [days, setDays] = useState([]);
  const [time, setTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [count, setCount] = useState(4);
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (studentInput?.days?.length && days.length === 0) {
      const normalized = studentInput.days.map((d) => String(d).toLowerCase());
      setDays(normalized.filter((d) => DAYS.includes(d)));
    }
    if (studentInput?.startTime && !time) {
      setTime(String(studentInput.startTime));
    } else if (studentInput?.start_time && !time) {
      setTime(String(studentInput.start_time));
    }
    if (studentInput?.format && format === "online") {
      const f = String(studentInput.format).toLowerCase();
      if (f === "offline" || f === "online") setFormat(f);
    }
  }, [studentInput, days.length, time, format]);

  const total = TITLES.length;

  const availableTimes = useMemo(() => {
    if (!startDate) return [];
    return generateSlotTimes(tutorAvailability, new Date(`${startDate}T00:00:00`), { step: 15 });
  }, [startDate, tutorAvailability]);

  const toggleDay = (d) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const validateStep = () => {
    setError("");
    switch (step) {
      case 0:
        if (!format) { setError(t("validation.required", "Required")); return false; }
        return true;
      case 1:
        if (format === "offline" && !isValidLocation(location)) {
          setError(t("schedule_wizard.location_required", "Place and address are required for offline lessons"));
          return false;
        }
        return true;
      case 2:
        if (days.length === 0) { setError(t("schedule_wizard.days_required", "Select at least one day")); return false; }
        return true;
      case 3:
        if (!startDate || new Date(`${startDate}T00:00:00`) < today) {
          setError(t("schedule_wizard.date_future", "Start date must be in the future"));
          return false;
        }
        return true;
      case 4:
        if (!time) { setError(t("booking.select_time", "Select a time")); return false; }
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, total - 1));
  };
  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const firstDate = startDate;

  const handleSubmit = async (variant = mode) => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      const basePayload = {
        date: firstDate,
        time,
        duration_minutes: Number(duration),
        timezone: getUserTimezone(),
        format: format.toUpperCase(),
        location_type: format === "offline" ? "offline" : "online",
        location,
        days: days.map((d) => d),
        start_date: firstDate,
        end_date: computeEndDate(startDate, count, days),
        count: Number(count),
      };
      const call = submitFn || (variant === "propose" ? proposeSubmit : defaultSubmit);
      await call(enrollment, basePayload);
      onSuccess?.();
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, t) || err.message || t("errors.default", "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  const proposeSubmit = async (enr, payload) => {
    const blocked = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(enr?.status);
    if (blocked) throw { code: "INVALID_APPLICATION_STATE", message: "INVALID_APPLICATION_STATE", error: "INVALID_APPLICATION_STATE" };
    const proposePayload = buildProposePayload({
      timezone: payload.timezone,
      format: payload.format,
      start_date: payload.start_date,
      end_date: payload.end_date,
      duration_minutes: payload.duration_minutes,
      days: payload.days,
      time: payload.time,
      location: payload.location,
      message: payload.message,
    });
    const { response, data } = await scheduleApi.propose(enr.id, proposePayload);
    if (!response.ok) {
      const err = { error: data?.error, message: data?.error || data?.message || data?.msg, code: data?.error || data?.code, status: response.status, data };
      err.data = data;
      throw err;
    }
    return data;
  };

  const defaultSubmit = async (enr, payload) => {
    // guard: do not allow scheduling for terminal / already scheduled states
    const blocked = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(enr?.status);
    if (blocked) {
      throw { code: "INVALID_APPLICATION_STATE", message: "INVALID_APPLICATION_STATE", error: "INVALID_APPLICATION_STATE" };
    }
    // For SCHEDULED, SCHEDULE_PROPOSED, SCHEDULE_PENDING we allow reschedule attempt
    // Try full payload first, fallback to minimal if backend rejects rich payload
    const attempt = async (p) => {
      const { response, data } = await enrollmentsApi.acceptAndSchedule(enr.id, p);
      if (!response.ok) {
        const err = { error: data?.error, message: data?.error || data?.message || data?.msg, code: data?.error || data?.code, status: response.status, data };
        err.data = data;
        throw err;
      }
      return data;
    };
    try {
      return await attempt(payload);
    } catch (err) {
      const code = err?.error || err?.code || err?.message;
      // if rich payload rejected as invalid state, try minimal payload (legacy backend)
      if (code === "INVALID_APPLICATION_STATE" && payload.days) {
        const minimal = {
          date: payload.date,
          time: payload.time,
          duration_minutes: payload.duration_minutes,
          timezone: payload.timezone,
        };
        try {
          return await attempt(minimal);
        } catch {
          // throw original error if minimal also fails
          throw err;
        }
      }
      throw err;
    }
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title={t("schedule_agreement.confirmed", "Schedule confirmed")}>
        <div className="schedule-wizard-success">
          <p>{t("schedule_wizard.success", "The schedule has been proposed. The other party can review and confirm it.")}</p>
          <button className="btn-primary" onClick={onClose}>{t("common.close", "Close")}</button>
        </div>
      </Modal>
    );
  }

  const studentName = enrollment?.student_name || enrollment?.student?.full_name || enrollment?.course?.teacher_name || "";
  const courseTitle = enrollment?.course_title || enrollment?.course?.title || course?.title || "";

  return (
    <Modal open onClose={onClose} title={TITLES[step] ? t(TITLES[step]) : ""} size="lg">
      <div className="schedule-wizard">
        <div className="wizard-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemax={total}>
          {TITLES.map((_, i) => (
            <span key={i} className={`wizard-dot ${i <= step ? "wizard-dot-active" : ""}`} />
          ))}
        </div>
        <p className="wizard-step-info">{t("application.step_of", "Step {{step}} of {{total}}", { step: step + 1, total })}</p>

        <div className="wizard-body">
          {step === 0 && (
            <fieldset className="format-group">
              <legend>{t("schedule_wizard.format", "Format")}</legend>
              {["online", "offline"].map((f) => (
                <label key={f} className="format-option">
                  <input type="radio" name="wizard-format" checked={format === f} onChange={() => setFormat(f)} />
                  <span>{t(`application.format_${f}`, f)}</span>
                </label>
              ))}
            </fieldset>
          )}

          {step === 1 && format === "offline" && (
            <LocationPicker value={location} onChange={setLocation} />
          )}
          {step === 1 && format === "online" && (
            <p className="wizard-hint">{t("schedule_wizard.online_hint", "This is an online lesson — a meeting link will be used.")}</p>
          )}

          {step === 2 && (
            <div className="days-group">
              {DAYS.map((d) => {
                const checked = days.includes(d);
                return (
                  <label key={d} className={`day-option ${checked ? "day-active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(d)}
                    />
                    <span>{t(DAY_KEY[d] || d)}</span>
                  </label>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="form-field">
              <label htmlFor="wizard-start-date">{t("schedule_wizard.start_date", "Start date")}</label>
              <CalendarPicker
                value={startDate}
                minDate={today.toISOString().split("T")[0]}
                days={days}
                onSelect={(d) => { setStartDate(d); setTime(""); }}
                ariaLabel={t("schedule_wizard.start_date", "Start date")}
              />
            </div>
          )}

          {step === 4 && (
            <div className="time-group">
              <p className="wizard-hint">
                {t("schedule_wizard.start_date", "Start date")}:{" "}
                <strong>{startDate || t("schedule_wizard.no_date", "not chosen yet")}</strong>
              </p>
              <MutualAvailability
                tutorAvailability={tutorAvailability}
                studentInput={studentInput}
                onPick={(s) => setTime(s.start)}
              />
              <details className="calendar-overlay-details">
                <summary>{t("schedule_wizard.view_availability", "View weekly availability")}</summary>
                <CalendarWeekOverlay availability={tutorAvailability} />
              </details>
              <p className="wizard-hint">{t("schedule_wizard.pick_time", "Pick a time from the available slots.")}</p>
              <div className="slot-grid">
                {!startDate && <p className="wizard-hint">{t("schedule_wizard.pick_date_first", "Choose a start date first")}</p>}
                {startDate && availableTimes.length === 0 && (
                  <p className="wizard-hint">{t("schedule_wizard.no_slots_for_date", "No available slots for this date.")}</p>
                )}
                {availableTimes.map((tm) => (
                  <button
                    key={tm}
                    type="button"
                    className={`slot-chip ${time === tm ? "slot-chip-active" : ""}`}
                    onClick={() => setTime(tm)}
                  >
                    {tm}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="count-group">
              {LESSON_COUNTS.map((c) => (
                <button key={c} type="button" className={`count-option ${count === c ? "count-active" : ""}`} onClick={() => setCount(c)}>
                  {c} {t("plural.lesson_genitive", "lessons")}
                </button>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="duration-group">
              {DURATIONS.map((d) => (
                <button key={d} type="button" className={`duration-option ${duration === d ? "duration-active" : ""}`} onClick={() => setDuration(d)}>
                  {d} {t("schedule.minutes_short", "min")}
                </button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="wizard-review">
              <p><strong>{t("schedule_agreement.student", "Student")}:</strong> {studentName}</p>
              <p><strong>{t("schedule_agreement.course", "Course")}:</strong> {courseTitle}</p>
              <p><strong>{t("schedule_agreement.format", "Format")}:</strong> {t(`application.format_${format}`)}</p>
              {format === "offline" && location && (
                <p><strong>{t("location.address", "Address")}:</strong> {location.address} {location.details && `(${location.details})`}</p>
              )}
              <p><strong>{t("schedule_wizard.days", "Days")}:</strong> {days.map((d) => t(DAY_KEY[d] || d)).join(", ")}</p>
              <p><strong>{t("schedule_wizard.time", "Time")}:</strong> {time} ({startDate})</p>
              <p><strong>{t("schedule_wizard.count", "Lessons")}:</strong> {count}</p>
              <p><strong>{t("schedule_agreement.options", "Duration")}:</strong> {duration} {t("schedule.minutes_short", "min")}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="schedule-wizard-error" role="alert">
            <p>{error}</p>
            {String(error).includes("другом статусе") || String(error).includes("already in another state") || String(error).includes("INVALID_APPLICATION_STATE") ? (
              <p className="schedule-wizard-hint">{t("errors.reload_hint", "Please refresh the page and check the current status.")}</p>
            ) : null}
          </div>
        )}

        <div className="schedule-wizard-actions">
          {step > 0 && <button type="button" className="btn-secondary" onClick={back} disabled={loading}>{t("application.back", "Back")}</button>}
          {step < total - 1 ? (
            <button type="button" className="btn-primary" onClick={next}>{t("application.next", "Next")}</button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={() => handleSubmit("assign")} disabled={loading}>
                {t("schedule_wizard.assign_immediately", "Assign immediately")}
              </button>
              <button type="button" className="btn-primary" onClick={() => handleSubmit("propose")} disabled={loading}>
                {loading ? t("common.loading", "Loading...") : t("schedule_wizard.propose_for_confirm", "Propose for confirmation")}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function computeEndDate(startDate, count, days) {
  if (!startDate || !days?.length) return startDate;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return startDate;
  const sessions = [];
  let cursor = new Date(start);
  let guard = 0;
  while (sessions.length < count && guard < 366) {
    const name = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][cursor.getDay()];
    if (days.includes(name)) sessions.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  const last = sessions[sessions.length - 1];
  if (!last) return startDate;
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../ui/Overlay";
import { CalendarPicker } from "../ui/CalendarPicker";
import { LocationPicker, isValidLocation } from "../LocationPicker";
import { MutualAvailability } from "./MutualAvailability";
import { CalendarWeekOverlay } from "../calendar/CalendarWeekOverlay";
import ManualTimePicker from "./ManualTimePicker";
import "../../styles/ManualTimePicker.css";
import { generateSlotTimes } from "../../utils/slots";
import { getUserTimezone } from "../../utils/timezone";
import { enrollmentsApi } from "../../api/enrollments.api";
import { scheduleApi, buildProposePayload } from "../../api/schedule.api";
import { getErrorMessage } from "../../utils/errorMessage";
import useAuthStore from "../../store/authStore";
import type { AvailabilitySlot, CourseDTO, EnrollmentDTO } from "../../types/api";

const DAYS: readonly string[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_KEY: Record<string, string> = {
  monday: "application.days_monday",
  tuesday: "application.days_tuesday",
  wednesday: "application.days_wednesday",
  thursday: "application.days_thursday",
  friday: "application.days_friday",
  saturday: "application.days_saturday",
  sunday: "application.days_sunday",
};
const LESSON_COUNTS: readonly number[] = [1, 4, 8, 12, 20];
const DURATIONS: readonly number[] = [45, 60, 90];

const TITLES: readonly string[] = [
  "schedule_wizard.format",
  "schedule_wizard.location",
  "schedule_wizard.days",
  "schedule_wizard.start_date",
  "schedule_wizard.time",
  "schedule_wizard.count",
  "schedule_wizard.duration",
  "schedule_wizard.review",
];

export interface ScheduleWizardProps {
  enrollment: EnrollmentDTO & Record<string, unknown>;
  course?: CourseDTO & Record<string, unknown>;
  tutorAvailability?: AvailabilitySlot[];
  studentInput?: Record<string, unknown>;
  onClose: () => void;
  onSuccess?: () => void;
  submitFn?: (enrollment: EnrollmentDTO, payload: Record<string, unknown>) => Promise<unknown>;
  mode?: "propose" | "assign";
}

export function ScheduleWizard({
  enrollment,
  course,
  tutorAvailability = [],
  studentInput = {},
  onClose,
  onSuccess,
  submitFn,
  mode = "propose",
}: ScheduleWizardProps): JSX.Element {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [step, setStep] = useState<number>(0);
  const [format, setFormat] = useState<string>("online");
  const [location, setLocation] = useState<Record<string, unknown> | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [timeValid, setTimeValid] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [count, setCount] = useState<number>(4);
  const [duration, setDuration] = useState<number>(60);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const tutorId = (useAuthStore((s) => (s.user as Record<string, unknown> | null)?.["id"]) as string | number | null) ?? (enrollment?.["tutor_id"] as string | number | undefined) ?? (enrollment?.["tutor"] as Record<string, unknown> | undefined)?.["id"] as string | number | undefined ?? (course as Record<string, unknown> | undefined)?.["teacher"] as Record<string, unknown> | undefined ? ((course as Record<string, unknown>)["teacher"] as Record<string, unknown>)["id"] as string | number : (course as Record<string, unknown> | undefined)?.["teacher_id"] as string | number | null ?? null;

  useEffect(() => {
    const si = studentInput as Record<string, unknown>;
    if (Array.isArray(si["days"]) && (si["days"] as unknown[]).length && days.length === 0) {
      const normalized = (si["days"] as unknown[]).map((d) => String(d).toLowerCase());
      setDays(normalized.filter((d) => DAYS.includes(d as never)));
    }
    if (si["startTime"] && !time) {
      setTime(String(si["startTime"]));
    } else if (si["start_time"] && !time) {
      setTime(String(si["start_time"]));
    }
    if (si["format"] && format === "online") {
      const f = String(si["format"]).toLowerCase();
      if (f === "offline" || f === "online") setFormat(f);
    }
  }, [studentInput, days.length, time, format]);

  const total = TITLES.length;

  const availableTimes = useMemo(() => {
    if (!startDate) return [];
    return generateSlotTimes(tutorAvailability, new Date(`${startDate}T00:00:00`), { step: 15 });
  }, [startDate, tutorAvailability]);

  useEffect(() => {
    if (time && duration && /^(\d{2}):(\d{2})$/.test(time)) {
      const [h, m] = time.split(":").map(Number);
      const tot = h * 60 + m + Number(duration);
      const e = `${String(Math.floor(tot / 60) % 24).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
      if (e !== endTime) setEndTime(e);
    }
  }, [duration, time, endTime]);

  const toggleDay = (d: string): void => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const validateStep = (): boolean => {
    setError("");
    switch (step) {
      case 0:
        if (!format) { setError(t("validation.required", "Required") as string); return false; }
        return true;
      case 1:
        if (format === "offline" && !isValidLocation(location as never)) {
          setError(t("schedule_wizard.location_required", "Place and address are required for offline lessons") as string);
          return false;
        }
        return true;
      case 2:
        if (days.length === 0) { setError(t("schedule_wizard.days_required", "Select at least one day") as string); return false; }
        return true;
      case 3:
        if (!startDate || new Date(`${startDate}T00:00:00`) < today) {
          setError(t("schedule_wizard.date_future", "Start date must be in the future") as string);
          return false;
        }
        return true;
      case 4:
        if (!time) { setError(t("booking.select_time", "Select a time") as string); return false; }
        if (!timeValid) { setError(t("schedule.manual.not_available", "Выбранное время недоступно — проверьте статус") as string); return false; }
        return true;
      default:
        return true;
    }
  };

  const next = (): void => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, total - 1));
  };
  const back = (): void => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const firstDate = startDate;

  const handleSubmit = async (variant: string = mode): Promise<void> => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      const basePayload: Record<string, unknown> = {
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
      await call(enrollment as EnrollmentDTO, basePayload);
      onSuccess?.();
      setDone(true);
    } catch (err: unknown) {
      const rec = err as Record<string, unknown>;
      const msg = getErrorMessage(err, t as (k: string, f: string) => string) || (rec["message"] as string | undefined) || t("errors.default", "Something went wrong.") as string;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const proposeSubmit = async (enr: Record<string, unknown>, payload: Record<string, unknown>): Promise<unknown> => {
    const blocked = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(String(enr?.["status"] ?? ""));
    if (blocked) throw { code: "INVALID_APPLICATION_STATE", message: "INVALID_APPLICATION_STATE", error: "INVALID_APPLICATION_STATE" };
    const proposePayload = buildProposePayload({
      timezone: String(payload["timezone"]),
      format: payload["format"] as string | undefined,
      start_date: String(payload["start_date"]),
      end_date: String(payload["end_date"]),
      duration_minutes: payload["duration_minutes"] as number | string,
      days: payload["days"] as string[] | undefined,
      time: payload["time"] as string | undefined,
      location: payload["location"] as never,
      message: payload["message"] as string | undefined,
    });
    const { response, data } = await scheduleApi.propose(String(enr["id"] ?? ""), proposePayload as unknown as Record<string, unknown>);
    const rec = data as Record<string, unknown> | null;
    if (!response.ok) {
      const err: Record<string, unknown> = { error: rec?.["error"], message: rec?.["error"] ?? rec?.["message"] ?? rec?.["msg"], code: rec?.["error"] ?? rec?.["code"], status: response.status, data };
      throw err;
    }
    return data;
  };

  const defaultSubmit = async (enr: Record<string, unknown>, payload: Record<string, unknown>): Promise<unknown> => {
    const blocked = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(String(enr?.["status"] ?? ""));
    if (blocked) {
      throw { code: "INVALID_APPLICATION_STATE", message: "INVALID_APPLICATION_STATE", error: "INVALID_APPLICATION_STATE" };
    }
    const attempt = async (p: Record<string, unknown>): Promise<unknown> => {
      const { response, data } = await enrollmentsApi.acceptAndSchedule(String(enr["id"] ?? ""), p);
      const rec = data as Record<string, unknown> | null;
      if (!response.ok) {
        const err: Record<string, unknown> = { error: rec?.["error"], message: rec?.["error"] ?? rec?.["message"] ?? rec?.["msg"], code: rec?.["error"] ?? rec?.["code"], status: response.status, data };
        throw err;
      }
      return data;
    };
    try {
      return await attempt(payload);
    } catch (err: unknown) {
      const rec = err as Record<string, unknown>;
      const code = (rec?.["error"] as string | undefined) ?? (rec?.["code"] as string | undefined) ?? (rec?.["message"] as string | undefined);
      if (code === "INVALID_APPLICATION_STATE" && payload["days"]) {
        const minimal: Record<string, unknown> = {
          date: payload["date"],
          time: payload["time"],
          duration_minutes: payload["duration_minutes"],
          timezone: payload["timezone"],
        };
        try {
          return await attempt(minimal);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  };

  if (done) {
    return (
      <Modal open onClose={onClose} title={t("schedule_agreement.confirmed", "Schedule confirmed") as string}>
        <div className="schedule-wizard-success">
          <p>{t("schedule_wizard.success", "The schedule has been proposed. The other party can review and confirm it.")}</p>
          <button className="btn-primary" onClick={onClose}>{t("common.close", "Close")}</button>
        </div>
      </Modal>
    );
  }

  const studentName = (enrollment?.["student_name"] as string | undefined) ?? (enrollment?.["student"] as Record<string, unknown> | undefined)?.["full_name"] as string | undefined ?? (enrollment?.["course"] as Record<string, unknown> | undefined)?.["teacher_name"] as string | undefined ?? "";
  const courseTitle = (enrollment?.["course_title"] as string | undefined) ?? (enrollment?.["course"] as Record<string, unknown> | undefined)?.["title"] as string | undefined ?? (course as Record<string, unknown> | undefined)?.["title"] as string | undefined ?? "";

  return (
    <Modal open onClose={onClose} title={TITLES[step] ? t(TITLES[step]) as string : ""} size="lg">
      <div className="schedule-wizard">
        <div className="wizard-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total} aria-valuetext={`${step + 1} из ${total}`} aria-label={t("application.step_of", "Step {{step}} of {{total}}", { step: step + 1, total }) as string}>
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
            <LocationPicker value={location as never} onChange={setLocation as never} />
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
                    <span>{t(DAY_KEY[d] ?? d)}</span>
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
                onSelect={(d) => { setStartDate(d); setTime(""); setEndTime(""); setTimeValid(false); }}
                ariaLabel={t("schedule_wizard.start_date", "Start date") as string}
              />
            </div>
          )}

          {step === 4 && (
            <div className="time-group">
              {!startDate ? (
                <p className="wizard-hint">{t("schedule_wizard.pick_date_first", "Choose a start date first")}</p>
              ) : (
                <>
                  <MutualAvailability
                    tutorAvailability={tutorAvailability}
                    studentInput={studentInput}
                    onPick={(s) => { setTime(s.start); const e = s.end || (()=>{const [h,m]=s.start.split(":").map(Number); const tot=h*60+m+duration; return `${String(Math.floor(tot/60)%24).padStart(2,"0")}:${String(tot%60).padStart(2,"0")}`})(); setEndTime(e); }}
                  />
                  <ManualTimePicker
                    tutorId={tutorId}
                    date={startDate}
                    initialStart={time || "18:00"}
                    initialEnd={endTime}
                    duration={duration}
                    quickSlots={availableTimes}
                    onChange={({ start, end, duration: d }) => { setTime(start); setEndTime(end); if (d && [30,45,60,90,120].includes(d)) setDuration(d); }}
                    onValidityChange={setTimeValid}
                  />
                  <details className="calendar-overlay-details">
                    <summary>{t("schedule_wizard.view_availability", "View weekly availability")}</summary>
                    <CalendarWeekOverlay availability={tutorAvailability as unknown as never} />
                  </details>
                </>
              )}
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
                <p><strong>{t("location.address", "Address")}:</strong> {(location as Record<string, unknown>)["address"] as string} {(location as Record<string, unknown>)["details"] ? `(${(location as Record<string, unknown>)["details"] as string})` : ""}</p>
              )}
              <p><strong>{t("schedule_wizard.days", "Days")}:</strong> {days.map((d) => t(DAY_KEY[d] ?? d)).join(", ")}</p>
              <p><strong>{t("schedule_wizard.time", "Time")}:</strong> {time}{endTime ? ` — ${endTime}` : ""} ({startDate})</p>
              <p><strong>{t("schedule_wizard.count", "Lessons")}:</strong> {count}</p>
              <p><strong>{t("schedule_agreement.options", "Duration")}:</strong> {duration} {t("schedule.minutes_short", "min")}</p>
              <div className="wizard-review-summary" style={{ marginTop: 12, padding: 12, background: "var(--color-primary-soft)", borderRadius: 10, fontSize: 13 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{t("schedule_wizard.summary", "Will be created: {{count}} lessons from {{from}} to {{to}}", { count, from: startDate, to: computeEndDate(startDate, count, days) })}</p>
                <p style={{ margin: "6px 0 0", color: "var(--color-text-secondary)" }}>{t("schedule_wizard.summary_hint", "Lessons are scheduled only on selected weekdays at the chosen time.")}</p>
              </div>
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

function computeEndDate(startDate: string, count: number, days: string[]): string {
  if (!startDate || !days?.length) return startDate;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return startDate;
  const sessions: Date[] = [];
  const cursor = new Date(start);
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

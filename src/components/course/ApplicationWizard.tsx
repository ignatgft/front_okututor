// migrated to TSX — minimal strict types (controlled)
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { studentsApi } from "../../api/students.api";
import { Modal } from "../ui/Overlay";
import { getErrorMessage } from "../../utils/errorMessage";
import { getUserTimezone } from "../../utils/timezone";

const DAY_KEYS = ["days_monday", "days_tuesday", "days_wednesday", "days_thursday", "days_friday", "days_saturday", "days_sunday"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * Multi-step course application wizard (spec §11-12, §61).
 * Format → preferred days/time → frequency/duration/comment.
 */
export default function ApplicationWizard({ courseId, isOpen, onClose, onSuccess }: Record<string, unknown>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState("");
  const [days, setDays] = useState([]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState(null);

  const total = 3;

  const nextEnabled = useMemo(() => {
    if (step === 0) return format !== "";
    if (step === 1) return days.length > 0;
    return frequency !== "" && duration !== "";
  }, [step, format, days.length, frequency, duration]);

  const validateStep = () => {
    const next = {};
    if (step === 0 && !format) next.format = t("application.error_format");
    if (step === 1) {
      if (days.length === 0) next.days = t("application.error_days");
      if (days.length > 0) {
        const toMinutes = (v) => {
          const [h, m] = String(v).split(":").map(Number);
          return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
        };
        if (toMinutes(startTime) >= toMinutes(endTime)) {
          next.time = t("application.error_time_range", "Start time must be before end time");
        }
      }
    }
    if (step === 2) {
      if (!frequency) next.frequency = t("application.error_frequency");
      if (!duration) next.duration = t("application.error_duration");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleDay = (idx) => {
    setDays((prev) => (prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort((a, b) => a - b)));
    setErrors((prev) => ({ ...prev, days: undefined }));
  };

  const buildPreferredSchedule = () => {
    const dayNames = days.map((d) => t(`application.${DAY_KEYS[d]}`)).join(", ");
    return `${dayNames} ${startTime}–${endTime}`;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, total - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        message: comment,
        preferred_schedule: buildPreferredSchedule(),
        preferred_format: format,
        preferred_days: days.map((d) => WEEKDAYS[d]),
        preferred_start_time: startTime,
        preferred_end_time: endTime,
        frequency,
        duration_minutes: Number(duration),
        timezone: getUserTimezone(),
      };
      const { response, data } = await studentsApi.requestCourse(courseId, payload);
      if (response.ok) {
        setEnrollmentId(data?.id || null);
        setSuccess(true);
        onSuccess?.();
      } else if (response.status === 409) {
        setErrors({ form: getErrorMessage({ error: "applicationAlreadyExists" }, t) });
      } else {
        setSubmitError(getErrorMessage(data, t));
      }
    } catch (e) {
      setSubmitError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setFormat("");
    setDays([]);
    setStartTime("18:00");
    setEndTime("20:00");
    setFrequency("");
    setDuration("");
    setComment("");
    setErrors({});
    setSubmitError("");
    setSuccess(false);
    setSubmitting(false);
    setEnrollmentId(null);
    onClose?.();
  };

  const footer = !success ? (
    <div className="app-wizard-footer">
      {step > 0 && (
        <button type="button" className="btn-secondary" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
          {t("application.back")}
        </button>
      )}
      {step < total - 1 ? (
        <button type="button" className="btn-primary" onClick={handleNext} disabled={!nextEnabled}>
          {t("application.next")}
        </button>
      ) : (
        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? t("application.submitting") : t("application.submit")}
        </button>
      )}
    </div>
  ) : (
    <div className="app-wizard-footer">
      <button type="button" className="btn-secondary" onClick={resetAndClose}>
        {t("common.close", "Close")}
      </button>
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          const url = enrollmentId ? `/student/requests/${enrollmentId}` : "/student/requests";
          onClose?.();
          navigate(url);
        }}
      >
        {t("application.go_to_request")}
      </button>
    </div>
  );

  return (
    <Modal open={isOpen} onClose={resetAndClose} title={t("application.title")} footer={footer} ariaLabel={t("application.title")}>
      {success ? (
        <div className="app-wizard-success">
          <CheckCircle className="app-success-icon" size={56} aria-hidden="true" />
          <h3>{t("application.success_title")}</h3>
          <p>{t("application.success_hint")}</p>
        </div>
      ) : (
        <>
          <p className="app-wizard-progress">{t("application.step_of", { step: step + 1, total })}</p>
          {errors.form && <p className="error-message" role="alert">{errors.form}</p>}
          {submitError && <p className="error-message" role="alert">{submitError}</p>}

          {step === 0 && (
            <fieldset className="app-wizard-fieldset">
              <legend className="app-wizard-label">{t("application.format_title")}</legend>
              {["online", "offline", "any"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`choice-card ${format === opt ? "choice-card-active" : ""}`}
                  onClick={() => { setFormat(opt); setErrors((p) => ({ ...p, format: undefined })); }}
                  aria-pressed={format === opt}
                >
                  {t(`application.format_${opt}`)}
                </button>
              ))}
              {errors.format && <p className="field-error" role="alert">{errors.format}</p>}
            </fieldset>
          )}

          {step === 1 && (
            <div className="app-wizard-schedule">
              <fieldset className="app-wizard-fieldset">
                <legend className="app-wizard-label">{t("application.schedule_title")}</legend>
                <div className="day-row">
                  {days.map((d) => (
                    <span key={d} className="day-chip">{t(`application.${DAY_KEYS[d]}`)}</span>
                  ))}
                </div>
                <div className="day-row">
                  {DAY_KEYS.map((k, idx) => (
                    <button
                      key={k}
                      type="button"
                      className={`day-toggle ${days.includes(idx) ? "day-toggle-active" : ""}`}
                      onClick={() => toggleDay(idx)}
                      aria-pressed={days.includes(idx)}
                    >
                      {t(`application.${k}`)}
                    </button>
                  ))}
                </div>
                {errors.days && <p className="field-error" role="alert">{errors.days}</p>}
              </fieldset>

              <div className="time-window">
                <label htmlFor="app-start">
                  <span className="visually-hidden">{t("schedule_agreement.time_from", "From")}</span>
                  <input id="app-start" type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setErrors((p)=>({...p, time: undefined })); }} />
                </label>
                <span className="time-sep">—</span>
                <label htmlFor="app-end">
                  <span className="visually-hidden">{t("schedule_agreement.time_to", "To")}</span>
                  <input id="app-end" type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setErrors((p)=>({...p, time: undefined })); }} />
                </label>
              </div>
              {errors.time && <p className="field-error" role="alert">{errors.time}</p>}
              <p className="time-window-hint">{t("application.time_window", { start: startTime, end: endTime })}</p>
            </div>
          )}

          {step === 2 && (
            <div className="app-wizard-details">
              <fieldset className="app-wizard-fieldset">
                <legend className="app-wizard-label">{t("application.frequency_title")}</legend>
                {["1", "2", "3"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`choice-card ${frequency === f ? "choice-card-active" : ""}`}
                    onClick={() => { setFrequency(f); setErrors((p) => ({ ...p, frequency: undefined })); }}
                    aria-pressed={frequency === f}
                  >
                    {t(`application.frequency_${f}`)}
                  </button>
                ))}
                {errors.frequency && <p className="field-error" role="alert">{errors.frequency}</p>}
              </fieldset>

              <fieldset className="app-wizard-fieldset">
                <legend className="app-wizard-label">{t("application.duration_title")}</legend>
                <div className="choice-row">
                  {["45", "60", "90"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`choice-card ${duration === d ? "choice-card-active" : ""}`}
                      onClick={() => { setDuration(d); setErrors((p) => ({ ...p, duration: undefined })); }}
                      aria-pressed={duration === d}
                    >
                      {t(`application.duration_${d}`)}
                    </button>
                  ))}
                </div>
                {errors.duration && <p className="field-error" role="alert">{errors.duration}</p>}
              </fieldset>

              <label className="app-wizard-label" htmlFor="app-comment">{t("application.comment_label")}</label>
              <textarea
                id="app-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("application.comment_placeholder")}
              />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { coursesApi } from "../api/courses.api";
import ConfirmModal from "./ui/ConfirmModal";
import {
  COURSE_SUBJECTS as SUBJECT_OPTIONS,
  COURSE_CATEGORIES as CATEGORY_OPTIONS,
  COURSE_DAYS as DAYS,
} from "../constants/course";
import "../styles/Course.css";
import "../styles/Dashboard.css";

const STEPS = ["basic", "subject", "description", "format", "location", "price", "schedule", "preview"];

export default function CourseWizard({ initialData }: Record<string, unknown>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title || "",
    subject: initialData?.subject || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    group_size: initialData?.group_size || "",
    max_students: initialData?.max_students || 2,
    location_type: initialData?.location_type || "",
    experience: initialData?.experience || 0,
    price_per_hour: initialData?.price_per_hour ?? 0,
    currency: initialData?.currency || "KGS",
    days: initialData?.days || "",
    specific_days: initialData?.specific_days ? String(initialData.specific_days).split(",") : [],
    status: initialData?.status || "DRAFT",
  });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const validateStep = () => {
    switch (STEPS[step]) {
      case "basic":
        return form.title.trim() ? "" : t("cr_course.errors.title_required", "Title is required");
      case "subject":
        return form.subject ? "" : t("become_tutor.error_subjects", "Select at least one subject");
      case "description":
        return form.description.trim() ? "" : t("cr_course.errors.description_required", "Description is required");
      case "format":
        return form.group_size ? "" : t("cr_course.placeholders.group", "Select format");
      case "location":
        return form.location_type ? "" : t("cr_course.placeholders.location", "Select location type");
      case "price":
        if (Number(form.price_per_hour) < 0) return t("cr_course.errors.price", "Invalid price");
        if (form.group_size === "group" && Number(form.max_students) < 2)
          return "Max students must be at least 2 for group courses";
        return "";
      case "schedule":
        return form.days ? "" : t("cr_course.placeholders.days", "Select schedule");
      default:
        return "";
    }
  };

  const next = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const buildPayload = (status) => ({
    title: form.title.trim(),
    description: form.description,
    subject: form.subject,
    category: form.category,
    days: form.days,
    specific_days: form.days === "specific" ? form.specific_days.join(",") : null,
    group_size: form.group_size,
    location_type: form.location_type,
    experience: Number(form.experience) || 0,
    price_per_hour: Number(form.price_per_hour) || 0,
    currency: form.currency,
    max_students: form.group_size === "group" ? Number(form.max_students) : 1,
    status,
  });

  const save = async (status) => {
    setLoading(true);
    setError("");
    try {
      const payload = buildPayload(status);
      if (isEditMode) {
        const { response, data } = await coursesApi.update(courseId, payload);
        if (!response.ok) throw new Error(data.error || data.message || t("common.error", "Error"));
        setSuccess(t("cr_course.update_success", "Course updated!"));
        navigate(`/course/${courseId}`);
      } else {
        const { response, data } = await coursesApi.create(payload);
        if (!response.ok) throw new Error(data.error || data.message || t("common.error", "Error"));
        navigate(`/course/${data.id}`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setConfirmPublish(false);
    }
  };

  const toggleDay = (day) =>
    setForm((prev) => ({
      ...prev,
      specific_days: prev.specific_days.includes(day)
        ? prev.specific_days.filter((d) => d !== day)
        : [...prev.specific_days, day],
    }));

  const numField = (label, key, props = {}) => (
    <div className="form-field">
      <label htmlFor={`cw-${key}`}>{label}</label>
      <input
        id={`cw-${key}`}
        type="number"
        value={form[key]}
        onChange={(e) => set({ [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  const stepContent = {
    basic: (
      <>
        <h3>{t("cw.step_basic", "Basic information")}</h3>
        <div className="form-field">
          <label htmlFor="cw-title">{t("cr_course.name", "Course title")}</label>
          <input
            id="cw-title"
            type="text"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={t("cr_course.placeholders.name")}
          />
        </div>
        {numField(t("cr_course.experience_label", "Years of experience"), "experience", { min: 0 })}
      </>
    ),
    subject: (
      <>
        <h3>{t("cw.step_subject", "Subject")}</h3>
        <div className="form-field">
          <label htmlFor="cw-subject">{t("cr_course.subject", "Subject")}</label>
          <select id="cw-subject" value={form.subject} onChange={(e) => set({ subject: e.target.value })}>
            <option value="" disabled>{t("cr_course.placeholders.subject", "Select subject")}</option>
            {SUBJECT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{t(s.labelKey, s.value)}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="cw-category">{t("cr_course.category", "Category")}</label>
          <select id="cw-category" value={form.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="" disabled>{t("cr_course.placeholders.category", "Select category")}</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{t(c.labelKey, c.value)}</option>)}
          </select>
        </div>
      </>
    ),
    description: (
      <>
        <h3>{t("cw.step_description", "Description")}</h3>
        <div className="form-field">
          <label htmlFor="cw-desc">{t("cr_course.description_label", "Description")}</label>
          <textarea
            id="cw-desc"
            rows={6}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder={t("cr_course.placeholders.description")}
          />
        </div>
      </>
    ),
    format: (
      <>
        <h3>{t("cw.step_format", "Format")}</h3>
        <div className="form-field">
          <label htmlFor="cw-group">{t("cr_course.group_label", "Group size")}</label>
          <select id="cw-group" value={form.group_size} onChange={(e) => set({ group_size: e.target.value })}>
            <option value="" disabled>{t("cr_course.placeholders.group")}</option>
            <option value="individual">{t("cr_course.group.individual", "Individual")}</option>
            <option value="group">{t("cr_course.group.group", "Group")}</option>
          </select>
        </div>
        {form.group_size === "group" &&
          numField(t("cr_course.max_students", "Max students"), "max_students", { min: 2, max: 50 })}
      </>
    ),
    location: (
      <>
        <h3>{t("cw.step_location", "Location")}</h3>
        <div className="form-field">
          <label htmlFor="cw-location">{t("cr_course.location_label", "Location type")}</label>
          <select id="cw-location" value={form.location_type} onChange={(e) => set({ location_type: e.target.value })}>
            <option value="" disabled>{t("cr_course.placeholders.location")}</option>
            <option value="online">{t("cr_course.location.online", "Online")}</option>
            <option value="offline">{t("cr_course.location.offline", "Offline")}</option>
          </select>
        </div>
      </>
    ),
    price: (
      <>
        <h3>{t("cw.step_price", "Price")}</h3>
        {numField(t("cr_course.price_label", "Price per hour"), "price_per_hour", { min: 0, step: "0.01" })}
        <div className="form-field">
          <label htmlFor="cw-currency">{t("cr_course.currency", "Currency")}</label>
          <select id="cw-currency" value={form.currency} onChange={(e) => set({ currency: e.target.value })}>
            {["KGS", "USD", "RUB"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </>
    ),
    schedule: (
      <>
        <h3>{t("cw.step_schedule", "Schedule")}</h3>
        <div className="form-field">
          <label htmlFor="cw-days">{t("cr_course.days_label", "Days")}</label>
          <select
            id="cw-days"
            value={form.days}
            onChange={(e) => set({ days: e.target.value, ...(e.target.value !== "specific" ? { specific_days: [] } : {}) })}
          >
            <option value="" disabled>{t("cr_course.placeholders.days")}</option>
            <option value="weekdays">{t("cr_course.days.weekdays", "Weekdays")}</option>
            <option value="weekends">{t("cr_course.days.weekends", "Weekends")}</option>
            <option value="specific">{t("cr_course.days.specific", "Specific days")}</option>
          </select>
        </div>
        {form.days === "specific" && (
          <div className="multi-select">
            {DAYS.map((d) => (
              <div key={d.value} className="select-item">
                <input
                  type="checkbox"
                  id={`cw-day-${d.value}`}
                  checked={form.specific_days.includes(d.value)}
                  onChange={() => toggleDay(d.value)}
                />
                <label htmlFor={`cw-day-${d.value}`}>{t(d.labelKey, d.value)}</label>
              </div>
            ))}
          </div>
        )}
      </>
    ),
    preview: null,
  };

  return (
    <div className="course-page">
      <div className="course-header">
        <h1>{isEditMode ? t("cr_course.edit_title") : t("cr_course.page_title")}</h1>
      </div>

      <div className="wizard-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
        {STEPS.map((key, idx) => (
          <span key={key} className={`wizard-step-dot ${idx <= step ? "done" : ""}`} aria-label={key} />
        ))}
      </div>

      {step < STEPS.length - 1 ? (
        <form
          className="course-form-container"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          {stepContent[STEPS[step]]}
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            {step > 0 && (
              <button type="button" className="cancel-btn" onClick={back}>
                {t("common.back", "Back")}
              </button>
            )}
            <button type="submit" className="create-btn">
              {t("common.next", "Next")}
            </button>
          </div>
        </form>
      ) : (
        <section className="course-form-container">
          <h3>{t("cw.step_preview", "Preview")}</h3>
          <p><strong>{form.title}</strong></p>
          <p>{form.description}</p>
          <p>{t("course.subject", "Subject")}: {form.subject}</p>
          <p>{t("cr_course.group_label", "Format")}: {form.group_size === "group" ? `${t("cr_course.group.group")} (${form.max_students})` : t("cr_course.group.individual")}</p>
          <p>{t("course.location", "Location")}: {form.location_type}</p>
          <p>{t("course.schedule", "Schedule")}: {form.days === "specific" ? form.specific_days.join(", ") : form.days}</p>
          <p><strong>{form.price_per_hour} {form.currency}</strong></p>

          {!isEditMode && (
            <p className="auth-form-hint">
              {t("cw.moderation_hint", "Submitted courses are reviewed by our team before publishing.")}
            </p>
          )}
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={back}>
              {t("common.back", "Back")}
            </button>
            {!isEditMode && (
              <button type="button" className="btn-secondary" onClick={() => save("DRAFT")} disabled={loading}>
                {t("cw.save_draft", "Save as draft")}
              </button>
            )}
            <button
              type="button"
              className="create-btn"
              disabled={loading}
              onClick={() => (isEditMode ? save(form.status) : setConfirmPublish(true))}
            >
              {isEditMode
                ? t("cr_course.save", "Save changes")
                : t("cw.submit_review", "Submit for review")}
            </button>
          </div>

          {isEditMode && (
            <Link to={`/course/${courseId}`} className="btn-link" style={{ marginTop: 8 }}>
              {t("cw.preview_as_student", "Preview as student")}
            </Link>
          )}
        </section>
      )}

      <ConfirmModal
        isOpen={confirmPublish}
        title={t("cw.submit_title", "Submit for review?")}
        message={t(
          "cw.submit_message",
          "Your course will be reviewed by our team. You'll be notified once it is approved."
        )}
        confirmLabel={t("cw.submit_review", "Submit for review")}
        loading={loading}
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => save("PENDING")}
      />
    </div>
  );
}

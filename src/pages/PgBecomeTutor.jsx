import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import DashboardLayout from "../components/DashboardLayout";
import { tutorsApi } from "../api/tutors.api";
import { COURSE_SUBJECTS as SUBJECTS, TUTOR_LANGUAGES as LANGUAGES } from "../constants/course";
import "../styles/Dashboard.css";
import "../styles/AuthForms.css";

const STEPS = ["personal", "experience", "education", "subjects", "languages", "about", "verification", "preview"];

export default function PgBecomeTutor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    experience_years: 0,
    experience_description: "",
    education: "",
    subjects: [],
    languages: [],
    bio: "",
    id_document_name: "",
  });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const toggleIn = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const validateStep = () => {
    switch (STEPS[step]) {
      case "personal":
        return form.full_name.trim() ? "" : t("become_tutor.error_name", "Name is required");
      case "subjects":
        return form.subjects.length > 0 ? "" : t("become_tutor.error_subjects", "Select at least one subject");
      case "languages":
        return form.languages.length > 0 ? "" : t("become_tutor.error_languages", "Select at least one language");
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

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await tutorsApi.submitApplication({
        ...form,
        languages: form.languages.join(","),
        subjects: form.subjects.join(","),
      });
      navigate("/tutor/application");
    } catch (e) {
      setError(e.message || t("become_tutor.error_submit", "Failed to submit application"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label, key, type = "text", props = {}) => (
    <div className="auth-form-field">
      <label htmlFor={`bt-${key}`}>{label}</label>
      <input
        id={`bt-${key}`}
        type={type}
        value={form[key]}
        onChange={(e) => set({ [key]: type === "number" ? Number(e.target.value) || 0 : e.target.value })}
        {...props}
      />
    </div>
  );

  const stepContent = {
    personal: (
      <>
        <h2>{t("become_tutor.step_personal", "Personal information")}</h2>
        {field(t("profile.full_name", "Full name"), "full_name")}
        {field(t("profile.phone", "Phone"), "phone", "tel")}
        {field(t("profile.location", "Location"), "location")}
      </>
    ),
    experience: (
      <>
        <h2>{t("become_tutor.step_experience", "Experience")}</h2>
        {field(t("cr_course.experience_label", "Years of experience"), "experience_years", "number", { min: 0 })}
        <div className="auth-form-field">
          <label htmlFor="bt-exp-desc">{t("become_tutor.experience_desc", "Describe your teaching experience")}</label>
          <textarea
            id="bt-exp-desc"
            rows={4}
            value={form.experience_description}
            onChange={(e) => set({ experience_description: e.target.value })}
          />
        </div>
      </>
    ),
    education: (
      <>
        <h2>{t("become_tutor.step_education", "Education")}</h2>
        <div className="auth-form-field">
          <label htmlFor="bt-education">{t("become_tutor.education", "University / degrees / certificates")}</label>
          <textarea
            id="bt-education"
            rows={3}
            value={form.education}
            onChange={(e) => set({ education: e.target.value })}
            placeholder={t("become_tutor.education_hint", "e.g. KSU, Mathematics, 2018-2022")}
          />
        </div>
      </>
    ),
    subjects: (
      <>
        <h2>{t("become_tutor.step_subjects", "Subjects")}</h2>
        <div className="multi-select">
          {SUBJECTS.map((s) => (
            <div key={s.value} className="select-item">
              <input
                type="checkbox"
                id={`subj-${s.value}`}
                checked={form.subjects.includes(s.value)}
                onChange={() => toggleIn("subjects", s.value)}
              />
              <label htmlFor={`subj-${s.value}`}>{t(s.labelKey, s.value)}</label>
            </div>
          ))}
        </div>
      </>
    ),
    languages: (
      <>
        <h2>{t("become_tutor.step_languages", "Languages")}</h2>
        <div className="multi-select">
          {LANGUAGES.map((l) => (
            <div key={l.value} className="select-item">
              <input
                type="checkbox"
                id={`lang-${l.value}`}
                checked={form.languages.includes(l.value)}
                onChange={() => toggleIn("languages", l.value)}
              />
              <label htmlFor={`lang-${l.value}`}>{t(l.labelKey, l.value)}</label>
            </div>
          ))}
        </div>
      </>
    ),
    about: (
      <>
        <h2>{t("become_tutor.step_about", "About you")}</h2>
        <div className="auth-form-field">
          <label htmlFor="bt-bio">{t("become_tutor.bio", "Short bio for students")}</label>
          <textarea
            id="bt-bio"
            rows={5}
            value={form.bio}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder={t("become_tutor.bio_hint", "Tell students why they should learn with you...")}
          />
        </div>
      </>
    ),
    verification: (
      <>
        <h2>{t("become_tutor.step_verification", "Verification")}</h2>
        {field(
          t("become_tutor.id_document", "ID document number"),
          "id_document_name",
          "text",
          { placeholder: t("become_tutor.id_document_hint", "Passport / ID series and number") }
        )}
        <p className="auth-form-hint">{t("become_tutor.verification_hint", "Your application will be reviewed by our team.")}</p>
      </>
    ),
    preview: null,
  };

  const currentKey = STEPS[step];

  return (
    <DashboardLayout title={t("become_tutor.title", "Become a tutor")}>
      <div className="wizard-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length + 1}>
        {STEPS.map((key, idx) => (
          <span key={key} className={`wizard-step-dot ${idx <= step ? "done" : ""}`} aria-label={key} />
        ))}
      </div>

      {step < STEPS.length ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          style={{ maxWidth: 520 }}
        >
          {stepContent[currentKey]}
          {error && <p className="auth-form-error">{error}</p>}
          <div className="form-actions" style={{ marginTop: 16 }}>
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
        <section style={{ maxWidth: 560 }}>
          <h2>{t("become_tutor.step_preview", "Preview")}</h2>
          <div className="booking-card">
            <div className="booking-info">
              <p><strong>{form.full_name || user?.full_name}</strong></p>
              <p>{form.bio}</p>
              <p>{t("cr_course.experience_label", "Experience")}: {form.experience_years}</p>
              <p>{t("become_tutor.education", "Education")}: {form.education}</p>
              <p>{t("course.subject", "Subject")}: {form.subjects.join(", ")}</p>
              <p>{t("become_tutor.languages", "Languages")}: {form.languages.join(", ")}</p>
            </div>
          </div>
          {error && <p className="auth-form-error">{error}</p>}
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" className="cancel-btn" onClick={back}>
              {t("common.back", "Back")}
            </button>
            <button type="button" className="create-btn" onClick={submit} disabled={submitting}>
              {submitting ? t("common.sending", "Sending...") : t("become_tutor.submit", "Submit application")}
            </button>
          </div>
        </section>
      )}

      {!user && (
        <p className="auth-form-hint" style={{ marginTop: 16 }}>
          <Link to="/login" className="btn-link">{t("navbar.login", "Login")}</Link>{" "}
          {t("become_tutor.login_first", "to save your progress under your account")}
        </p>
      )}
    </DashboardLayout>
  );
}

// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supportApi } from "../api/support.api";
import DashboardLayout from "../components/DashboardLayout";
import { Spinner } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import "../styles/Support.css";

export default function PgSupportNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!category) e.category = t("support.error_category_required", "Category is required");
    if (!subject.trim()) e.subject = t("support.error_subject_required", "Subject is required");
    else if (subject.length > 120) e.subject = t("support.error_subject_max", "Subject must be 120 characters or less");
    if (!description.trim()) e.description = t("support.error_description_required", "Description is required");
    else if (description.length < 10) e.description = t("support.error_description_min", "Description must be at least 10 characters");
    else if (description.length > 2000) e.description = t("support.error_description_max", "Description must be 2000 characters or less");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { response, data } = await supportApi.createTicket({ category, subject: subject.trim(), description: description.trim(), priority });
      if (response.ok && data?.id) {
        toast?.success(t("support.ticket_created", "Ticket created"));
        navigate(`/support/tickets/${data.id}`);
      } else {
        toast?.error(t("support.create_failed", "Failed to create ticket"));
      }
    } catch {
      toast?.error(t("support.create_failed", "Failed to create ticket"));
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "TECHNICAL", label: t("support.category.technical", "Technical") },
    { value: "PAYMENT", label: t("support.category.payment", "Payment") },
    { value: "ACCOUNT", label: t("support.category.account", "Account") },
    { value: "LESSON", label: t("support.category.lesson", "Lesson") },
    { value: "COURSE", label: t("support.category.course", "Course") },
    { value: "TUTOR", label: t("support.category.tutor", "Tutor") },
    { value: "STUDENT", label: t("support.category.student", "Student") },
    { value: "BUG", label: t("support.category.bug", "Bug") },
    { value: "OTHER", label: t("support.category.other", "Other") },
  ];

  return (
    <DashboardLayout title={t("support.new_ticket", "New ticket")} subtitle={t("support.new_ticket_hint", "Describe your issue and we will help you")}>
      <div className="support-page support-form-page">
        <form className="support-create-form" onSubmit={handleSubmit} noValidate>
          <div className="support-form-group">
            <label className="support-form-label" htmlFor="support-category">
              {t("support.category", "Category")} <span className="support-required">*</span>
            </label>
            <select
              id="support-category"
              className={`support-form-select ${errors.category ? "support-form-error" : ""}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t("support.select_category", "Select category...")}</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <span className="support-form-error-text" role="alert">{errors.category}</span>}
          </div>

          <div className="support-form-group">
            <label className="support-form-label" htmlFor="support-subject">
              {t("support.subject", "Subject")} <span className="support-required">*</span>
            </label>
            <input
              id="support-subject"
              type="text"
              className={`support-form-input ${errors.subject ? "support-form-error" : ""}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder={t("support.subject_placeholder", "Brief description of your issue")}
            />
            {errors.subject && <span className="support-form-error-text" role="alert">{errors.subject}</span>}
            <span className="support-form-char-count">{subject.length}/120</span>
          </div>

          <div className="support-form-group">
            <label className="support-form-label" htmlFor="support-priority">
              {t("support.priority", "Priority")}
            </label>
            <select
              id="support-priority"
              className="support-form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {[
                { value: "LOW", label: t("support.priority.low", "Low") },
                { value: "NORMAL", label: t("support.priority.normal", "Normal") },
                { value: "HIGH", label: t("support.priority.high", "High") },
                { value: "URGENT", label: t("support.priority.urgent", "Urgent") },
              ].map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="support-form-group">
            <label className="support-form-label" htmlFor="support-description">
              {t("support.description", "Description")} <span className="support-required">*</span>
            </label>
            <textarea
              id="support-description"
              className={`support-form-textarea ${errors.description ? "support-form-error" : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder={t("support.description_placeholder", "Describe your issue in detail...")}
            />
            {errors.description && <span className="support-form-error-text" role="alert">{errors.description}</span>}
            <span className="support-form-char-count">{description.length}/2000</span>
          </div>

          <div className="support-form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/support")}>
              {t("common.cancel", "Cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Spinner label="" /> : t("support.submit_ticket", "Submit ticket")}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

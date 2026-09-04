// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supportApi } from "../../api/support.api";
import { Spinner } from "../ui/Primitives";
import { useToast } from "../ui/Toast";
import "../../styles/NewTicketModal.css";

const CATEGORIES = [
  "TECHNICAL",
  "PAYMENT",
  "ACCOUNT",
  "LESSON",
  "COURSE",
  "TUTOR",
  "STUDENT",
  "BUG",
  "OTHER",
];

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

export default function NewTicketModal({ onClose, onCreated }: Record<string, unknown>) {
  const { t } = useTranslation();
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
      const { response, data } = await supportApi.createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      if (response.ok && data?.id) {
        toast?.success(t("support.ticket_created", "Ticket created"));
        onCreated?.(data);
      } else {
        toast?.error(t("support.create_failed", "Failed to create ticket"));
      }
    } catch {
      toast?.error(t("support.create_failed", "Failed to create ticket"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-ticket-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="new-ticket-modal" role="dialog" aria-modal="true" aria-labelledby="new-ticket-title">
        <div className="new-ticket-header">
          <h2 id="new-ticket-title">{t("support.new_ticket", "New ticket")}</h2>
          <button type="button" className="new-ticket-close" onClick={onClose} aria-label={t("a11y.close_modal", "Close")}>
            ✕
          </button>
        </div>

        <form className="new-ticket-form" onSubmit={handleSubmit} noValidate>
          <div className="new-ticket-field">
            <label className="new-ticket-label" htmlFor="nt-category">
              {t("support.category_title", "Category")} <span className="new-ticket-required">*</span>
            </label>
            <select
              id="nt-category"
              className={`new-ticket-select ${errors.category ? "new-ticket-error" : ""}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t("support.select_category", "Select category...")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`support.category.${c.toLowerCase()}`, c)}</option>
              ))}
            </select>
            {errors.category && <span className="new-ticket-error-text" role="alert">{errors.category}</span>}
          </div>

          <div className="new-ticket-field">
            <label className="new-ticket-label" htmlFor="nt-subject">
              {t("support.subject", "Subject")} <span className="new-ticket-required">*</span>
            </label>
            <input
              id="nt-subject"
              type="text"
              className={`new-ticket-input ${errors.subject ? "new-ticket-error" : ""}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder={t("support.subject_placeholder", "Brief description of your issue")}
            />
            {errors.subject && <span className="new-ticket-error-text" role="alert">{errors.subject}</span>}
          </div>

          <div className="new-ticket-field">
            <label className="new-ticket-label" htmlFor="nt-priority">
              {t("support.priority_title", "Priority")}
            </label>
            <select id="nt-priority" className="new-ticket-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{t(`support.priority.${p.toLowerCase()}`, p)}</option>
              ))}
            </select>
          </div>

          <div className="new-ticket-field">
            <label className="new-ticket-label" htmlFor="nt-description">
              {t("support.description", "Description")} <span className="new-ticket-required">*</span>
            </label>
            <textarea
              id="nt-description"
              className={`new-ticket-textarea ${errors.description ? "new-ticket-error" : ""}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={t("support.description_placeholder", "Describe your issue in detail...")}
            />
            {errors.description && <span className="new-ticket-error-text" role="alert">{errors.description}</span>}
          </div>

          <div className="new-ticket-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t("common.cancel", "Cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Spinner label="" /> : t("support.submit_ticket", "Submit ticket")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 className="confirm-title" id="confirm-title">{title}</h2>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel || t("common.cancel", "Cancel")}
          </button>
          <button type="button" className={`confirm-confirm ${tone === "danger" ? "danger" : ""}`} onClick={onConfirm} disabled={loading}>
            {loading ? t("common.loading", "Loading...") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
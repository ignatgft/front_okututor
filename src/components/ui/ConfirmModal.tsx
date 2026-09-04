import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/ConfirmModal.css";
import type { ReactNode } from "react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ConfirmModal = ({ isOpen, title, message, confirmLabel, cancelLabel, danger = true, loading = false, onConfirm, onCancel }: ConfirmModalProps): JSX.Element | null => {
  const { t } = useTranslation();
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Tab") {
        const focusable = document.querySelectorAll<HTMLButtonElement>(".confirm-box button:not([disabled])");
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={() => onCancel?.()} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={() => onCancel?.()}>
            {cancelLabel || t("common.cancel", "Cancel")}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`confirm-accept ${danger ? "danger" : ""}`}
            onClick={() => onConfirm?.()}
            disabled={loading}
          >
            {loading ? <span aria-busy="true">{t("common.loading", "Loading...")}</span> : confirmLabel || t("common.confirm", "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

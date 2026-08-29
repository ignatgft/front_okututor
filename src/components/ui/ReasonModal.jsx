import { useState } from "react";
import Modal from "../AuthRegister/Modal";
import { useTranslation } from "react-i18next";

export default function ReasonModal({ isOpen, title, onConfirm, onCancel, loading }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="confirm-box">
        <h3>{title}</h3>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("common.reject_reason_hint", "Provide a reason for the applicant...")}
          aria-label={t("admin.rejection_reason_label", "Rejection reason")}
          required
        />
        <div className="confirm-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={loading || !reason.trim()}
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
            }}
          >
            {t("admin.reject", "Reject")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

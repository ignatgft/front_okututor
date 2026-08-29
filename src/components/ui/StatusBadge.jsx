import { useTranslation } from "react-i18next";
import "../../styles/ui.css";

const STATUS_TONES = {
  // Completed / success
  COMPLETED: "success",
  CONFIRMED: "success",
  APPROVED: "success",
  ACCEPTED: "success",
  ACTIVE: "success",
  SUCCESS: "success",
  VERIFIED: "success",
  PAID: "success",
  // Pending / warning
  PENDING: "warning",
  PROPOSED: "warning",
  REQUESTED: "warning",
  RESCHEDULED: "warning",
  SCHEDULED: "warning",
  AWAITING: "warning",
  // Neutral
  CANCELLED: "neutral",
  REJECTED: "neutral",
  CANCELED: "neutral",
  DRAFT: "neutral",
  NO_SHOW: "danger",
};

const DEFAULT_TONE = "neutral";

function toneForStatus(status) {
  const key = String(status || "").toUpperCase();
  return (key in STATUS_TONES ? STATUS_TONES[key] : DEFAULT_TONE);
}

export function StatusBadge({ status, tone, label, translate = true, className = "" }) {
  const { t } = useTranslation();
  const resolvedTone = tone || toneForStatus(status);
  const key = String(status || "").toUpperCase();
  const text = label || (translate ? t(`statuses.${key}`, String(status || "")) : String(status || ""));
  return (
    <span className={`status-badge status-badge-${resolvedTone} ${className}`}>
      {text}
    </span>
  );
}

export default StatusBadge;

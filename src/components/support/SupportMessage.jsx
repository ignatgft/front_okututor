import { useTranslation } from "react-i18next";
import { MESSAGE_CLIENT_STATUS } from "../../constants/support";

export default function SupportMessage({ message, currentUserId }) {
  const { t } = useTranslation();
  const isOwn = message.sender_id === currentUserId;
  const isInternal = message.type === "INTERNAL_NOTE";
  const isFailed = message.client_status === MESSAGE_CLIENT_STATUS.FAILED;
  const isSending = message.client_status === MESSAGE_CLIENT_STATUS.SENDING;

  return (
    <div
      className={`support-message ${isOwn ? "support-message--own" : "support-message--other"} ${isInternal ? "support-message--internal" : ""}`}
      role="article"
      aria-label={isInternal ? t("support.internal_note", "Internal note") : t("support.message_from", "Message from {{name}}", { name: message.sender_name })}
    >
      {isInternal && (
        <div className="support-message-internal-badge">
          {t("support.internal_note", "Internal note")}
        </div>
      )}
      <div className="support-message-sender">{message.sender_name}</div>
      <div className="support-message-body">{message.body}</div>
      <div className="support-message-footer">
        <span className="support-message-time">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {isOwn && (
          <span className={`support-message-status support-message-status-${message.client_status || "SENT"}`}>
            {isSending && t("support.sending", "Sending...")}
            {isFailed && t("support.failed", "Failed")}
            {!isSending && !isFailed && t("support.sent", "Sent")}
          </span>
        )}
      </div>
    </div>
  );
}

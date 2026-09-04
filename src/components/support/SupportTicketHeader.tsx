// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";

export default function SupportTicketHeader({ ticket, onReopen, onCloseDialog }: Record<string, unknown>) {
  const { t } = useTranslation();
  if (!ticket) return null;
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  return (
    <div className="support-ticket-header">
      <div className="support-ticket-header-info">
        <span className="support-ticket-id">{ticket.id}</span>
        <h2 className="support-ticket-subject">{ticket.subject}</h2>
      </div>
      <div className="support-ticket-actions">
        {isClosed ? (
          <button type="button" className="btn-primary" onClick={onReopen}>
            {t("support.reopen", "Reopen")}
          </button>
        ) : (
          <button type="button" className="btn-secondary" onClick={onCloseDialog}>
            {t("support.close_ticket", "Close ticket")}
          </button>
        )}
      </div>
    </div>
  );
}

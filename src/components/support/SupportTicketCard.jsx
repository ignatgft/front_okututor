import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import SupportTicketStatus from "./SupportTicketStatus";
import SupportTicketPriority from "./SupportTicketPriority";
import SupportTicketCategory from "./SupportTicketCategory";

export default function SupportTicketCard({ ticket, basePath = "/support/tickets" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      className={`support-ticket-card ${ticket.unread_count > 0 ? "support-ticket-card--unread" : ""}`}
      onClick={() => navigate(`${basePath}/${ticket.id}`)}
      type="button"
      aria-label={`${ticket.id}: ${ticket.subject}`}
    >
      <div className="support-ticket-card-header">
        <span className="support-ticket-id">{ticket.id}</span>
        <SupportTicketStatus status={ticket.status} />
        {ticket.unread_count > 0 && (
          <span className="support-unread-badge" aria-label={t("support.unread_count", "{{count}} new", { count: ticket.unread_count })}>
            {ticket.unread_count}
          </span>
        )}
      </div>
      <div className="support-ticket-card-subject">{ticket.subject}</div>
      <div className="support-ticket-card-meta">
        <SupportTicketCategory category={ticket.category} />
        <SupportTicketPriority priority={ticket.priority} />
        <span className="support-ticket-date">
          {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}
        </span>
      </div>
      {ticket.last_message_preview && (
        <div className="support-ticket-card-preview">{ticket.last_message_preview}</div>
      )}
    </button>
  );
}

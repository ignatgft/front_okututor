// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import SupportTicketStatus from "../../support/SupportTicketStatus";
import SupportTicketPriority from "../../support/SupportTicketPriority";
import SupportTicketCategory from "../../support/SupportTicketCategory";

export default function AdminSupportTable({ tickets }: Record<string, unknown>) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!tickets?.length) return null;

  return (
    <div className="admin-support-table-wrap">
      <table className="admin-support-table" role="grid">
        <thead>
          <tr>
            <th>{t("support.id", "ID")}</th>
            <th>{t("support.user", "User")}</th>
            <th>{t("support.subject", "Subject")}</th>
            <th>{t("support.category", "Category")}</th>
            <th>{t("support.priority", "Priority")}</th>
            <th>{t("support.status", "Status")}</th>
            <th>{t("support.assigned", "Assigned")}</th>
            <th>{t("support.updated", "Updated")}</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr
              key={ticket.id}
              className={`admin-support-row ${ticket.unread_count > 0 ? "admin-support-row--unread" : ""}`}
              onClick={() => navigate(`/admin/support/tickets/${ticket.id}`)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(`/admin/support/tickets/${ticket.id}`); }}
            >
              <td><span className="support-ticket-id">{ticket.id}</span></td>
              <td className="admin-support-user">{ticket.user?.name || "-"}</td>
              <td className="admin-support-subject">{ticket.subject}</td>
              <td><SupportTicketCategory category={ticket.category} /></td>
              <td><SupportTicketPriority priority={ticket.priority} /></td>
              <td><SupportTicketStatus status={ticket.status} /></td>
              <td>{ticket.assigned_admin_name || <span className="admin-support-unassigned">{t("support.unassigned", "Unassigned")}</span>}</td>
              <td>{new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useSupportTickets from "../hooks/support/useSupportTickets";
import DashboardLayout from "../components/DashboardLayout";
import SupportTicketCard from "../components/support/SupportTicketCard";
import SupportFilterBar from "../components/support/SupportFilterBar";
import { Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import "../styles/Support.css";

export default function PgSupport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { tickets, loading, error, refetch } = useSupportTickets(filter);

  return (
    <DashboardLayout title={t("support.my_tickets", "My Tickets")} subtitle={t("support.my_tickets_hint", "Track and respond to your support requests")}>
      <div className="support-page">
        <div className="support-header-row">
          <SupportFilterBar filter={filter} onFilterChange={setFilter} />
          <button type="button" className="btn-primary" onClick={() => navigate("/support/new")}>
            {t("support.new_ticket", "New ticket")}
          </button>
        </div>

        {loading && <Spinner label={t("common.loading", "Loading...")} />}

        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            title={t("support.no_tickets", "No tickets yet")}
            hint={t("support.no_tickets_hint", "Create a ticket if you need help")}
          />
        )}

        <div className="support-ticket-list" role="list" aria-label={t("support.my_tickets", "My Tickets")}>
          {tickets.map(ticket => (
            <div key={ticket.id} role="listitem">
              <SupportTicketCard ticket={ticket} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

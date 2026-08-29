import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useAdminSupport from "../hooks/support/useAdminSupport";
import { usePageTitle } from "../components/pageTitleContext";
import AdminSupportStats from "../components/admin/support/AdminSupportStats";
import AdminSupportFilters from "../components/admin/support/AdminSupportFilters";
import AdminSupportTable from "../components/admin/support/AdminSupportTable";
import { Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import "../styles/AdminSupport.css";

export default function PgAdminSupport() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const [filters, setFilters] = useState({ status: "", category: "", priority: "", search: "" });
  const { tickets, loading, error, refetch, stats } = useAdminSupport(filters);

  useEffect(() => { setPageTitle(t("admin.support", "Support")); }, [setPageTitle, t]);

  return (
      <div className="admin-support-page">
        <AdminSupportStats stats={stats} />
        <AdminSupportFilters filters={filters} onFiltersChange={setFilters} />

        {loading && <Spinner label={t("common.loading", "Loading...")} />}

        {error && !loading && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            title={t("support.no_tickets", "No tickets")}
            hint={t("support.no_tickets_hint", "No tickets match your filters")}
          />
        )}

        {!loading && !error && tickets.length > 0 && (
          <AdminSupportTable tickets={tickets} />
        )}
      </div>
  );
}

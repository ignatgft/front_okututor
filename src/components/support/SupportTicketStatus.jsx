import { useTranslation } from "react-i18next";
import { STATUS_I18N } from "../../constants/support";

export default function SupportTicketStatus({ status }) {
  const { t } = useTranslation();
  const cls = String(status || "").toLowerCase().replace(/_/g, "-");
  return <span className={`support-status support-status-${cls}`}>{t(STATUS_I18N[status] || status, status)}</span>;
}

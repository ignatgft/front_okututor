// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";
import { PRIORITY_I18N } from "../../constants/support";

export default function SupportTicketPriority({ priority }: Record<string, unknown>) {
  const { t } = useTranslation();
  const cls = String(priority || "").toLowerCase();
  return <span className={`support-priority support-priority-${cls}`}>{t(PRIORITY_I18N[priority] || priority, priority)}</span>;
}

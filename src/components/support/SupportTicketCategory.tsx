// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";
import { CATEGORY_I18N } from "../../constants/support";

export default function SupportTicketCategory({ category }: Record<string, unknown>) {
  const { t } = useTranslation();
  return <span className="support-category">{t(CATEGORY_I18N[category] || category, category)}</span>;
}

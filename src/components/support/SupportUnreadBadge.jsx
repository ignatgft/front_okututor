import { useTranslation } from "react-i18next";

export default function SupportUnreadBadge({ count }) {
  const { t } = useTranslation();
  if (!count || count <= 0) return null;
  return (
    <span className="support-unread-badge" aria-label={t("support.unread_count", "{{count}} new", { count })}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

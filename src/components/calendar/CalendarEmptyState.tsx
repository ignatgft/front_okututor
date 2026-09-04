import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../ui/Primitives";

export interface CalendarEmptyStateProps {
  hasAnyEvents?: boolean;
}

export default function CalendarEmptyState({ hasAnyEvents }: CalendarEmptyStateProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="📅"
      title={t("calendar.empty_day", "No lessons on this day")}
      hint={
        !hasAnyEvents ? (
          <Link className="btn-primary calendar-empty-cta" to="/student/search">
            {t("calendar.find_course", "Find a course")}
          </Link>
        ) : undefined
      }
    />
  );
}

// migrated to TSX — minimal strict types (controlled)
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PgForbidden() {
  const { t } = useTranslation();
  return (
    <div className="error-page" role="main">
      <span className="error-page-code">403</span>
      <h1>{t("errors.forbidden", "Access denied")}</h1>
      <p>{t("errors.forbidden_hint", "You do not have permission to access this page.")}</p>
      <Link to="/" className="btn-primary">
        {t("buttons.back_home", "Back to Home")}
      </Link>
    </div>
  );
}

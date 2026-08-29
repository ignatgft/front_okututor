import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PgNotFound() {
  const { t } = useTranslation();
  return (
    <div className="error-page" role="main">
      <span className="error-page-code">404</span>
      <h1>{t("errors.not_found", "Page not found")}</h1>
      <p>{t("errors.not_found_hint", "The page you are looking for does not exist or has been moved.")}</p>
      <Link to="/" className="btn-primary">
        {t("buttons.back_home", "Back to Home")}
      </Link>
    </div>
  );
}

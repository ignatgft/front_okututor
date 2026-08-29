import { useTranslation } from "react-i18next";
import "../../styles/ui.css";

export function LoadingState({ label, hint, variant = "full" }) {
  const { t } = useTranslation();
  return (
    <div className={`loading-state loading-state-${variant}`} role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <p className="loading-state-label">{label || t("common.loading", "Loading...")}</p>
      {hint && <p className="loading-state-hint">{hint}</p>}
    </div>
  );
}

export default LoadingState;

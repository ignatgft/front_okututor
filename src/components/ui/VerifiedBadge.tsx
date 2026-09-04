import { useTranslation } from "react-i18next";
import "../../styles/ui.css";

export interface VerifiedBadgeProps {
  verified?: boolean;
  size?: number;
  label?: string;
  className?: string;
}

export function VerifiedBadge({ verified = true, size = 16, label, className = "" }: VerifiedBadgeProps): JSX.Element | null {
  const { t } = useTranslation();
  if (!verified) return null;
  const text = label || t("verified.label", "Verified");
  return (
    <span
      className={`verified-badge ${className}`}
      title={text}
      aria-label={text}
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path
          d="M7.5 12.5l3 3 6-6"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default VerifiedBadge;

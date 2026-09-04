/* eslint-disable react-refresh/only-export-components */
// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";
import { ENROLLMENT_STATUS } from "../../constants/enums";
import { applicationStatusLabel } from "../../utils/statusLabels";

/**
 * Status-driven CTA model for course detail (spec §58) and the student
 * flow. Given the current student application status for a course, this
 * produces the correct CTA — never lets the frontend show "Apply" when an
 * active application already exists.
 */

export function resolveCourseCta(status, { isOwner, isAuthenticated }) {
  if (isOwner || !isAuthenticated) return null;

  switch (status) {
    case ENROLLMENT_STATUS.NOT_REQUESTED:
      return { type: "apply", key: "application.title" };
    case ENROLLMENT_STATUS.PENDING:
      return { type: "pending", key: "statuses.PENDING" };
    case ENROLLMENT_STATUS.NEEDS_INFO:
      return { type: "needs_info", key: "statuses.NEEDS_INFO" };
    case ENROLLMENT_STATUS.ACCEPTED:
      return { type: "schedule_pending", key: "statuses.SCHEDULE_PENDING" };
    case ENROLLMENT_STATUS.SCHEDULE_PENDING:
      return { type: "schedule_pending", key: "statuses.SCHEDULE_PENDING" };
    case ENROLLMENT_STATUS.SCHEDULE_PROPOSED:
      return { type: "confirm_schedule", key: "request_detail.accept_schedule" };
    case ENROLLMENT_STATUS.SCHEDULED:
      return { type: "view_schedule", key: "request_detail.view_schedule" };
    case ENROLLMENT_STATUS.COMPLETED:
      return { type: "review", key: "request_detail.review" };
    case ENROLLMENT_STATUS.REJECTED:
      return { type: "rejected", key: "statuses.REJECTED" };
    case ENROLLMENT_STATUS.CANCELLED:
      return { type: "apply", key: "application.title" };
    case ENROLLMENT_STATUS.EXPIRED:
      return { type: "apply", key: "application.title" };
    default:
      return { type: "apply", key: "application.title" };
  }
}

/**
 * Small presentational helper: renders the friendly label for a status,
 * always via i18n (never the raw enum).
 */
export function StatusPill({ status, tone }) {
  const { t } = useTranslation();
  return <span className={`status-badge ${tone ? `status-badge-${tone}` : ""}`}>{applicationStatusLabel(status, t)}</span>;
}

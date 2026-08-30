/**
 * Centralized error-code → i18n-key mapper (spec §68).
 *
 * Backend returns `{ message, error }` where `error` is a stable machine
 * code (e.g. "SCHEDULE_CONFLICT"). We never show raw backend enums as UI
 * text — every stable code is translated to a human-readable i18n label.
 */

export const ERROR_CODE_KEYS = {
  SCHEDULE_CONFLICT: "errors.scheduleConflict",
  MEETING_NOT_AVAILABLE: "errors.meetingNotAvailable",
  REVIEW_NOT_ALLOWED: "errors.reviewNotAllowed",
  NOT_ELIGIBLE: "errors.notEligible",
  INVALID_APPLICATION_STATE: "errors.invalidApplicationState",
  SCHEDULE_NOT_AVAILABLE: "errors.scheduleNotAvailable",
  LESSON_CONFLICT: "errors.lessonConflict",
  INVALID_TIMEZONE: "errors.invalidTimezone",
  INVALID_DATE: "errors.invalidDate",
  RATE_LIMITED: "errors.rate_limited",
  TOO_MANY_ATTEMPTS: "errors.too_many_attempts",
  CONFLICT: "errors.default",
};

/**
 * Extract the backend machine error code from the normalized error.
 * Supports both the http-layer normalized error and the ApiRequestError shape.
 */
export function extractErrorCode(error) {
  if (!error) return null;
  if (typeof error === "string") return error;
  // Normalized by errorMapper: { code: 'CONFLICT' } or raw backend { error: 'SCHEDULE_CONFLICT' }
  return error.code || error.error || null;
}

/**
 * Return a localized message for an API error. Falls back to default text.
 *
 * @param {object|string} error normalized error ({message, code} or {error})
 * @param {Function} t i18next translate function
 */
export function getErrorMessage(error, t) {
  const code = extractErrorCode(error);
  if (code && ERROR_CODE_KEYS[code]) {
    return t(ERROR_CODE_KEYS[code]);
  }
  if (code && typeof code === "string" && code.startsWith("errors.")) {
    const v = t(code);
    if (v && v !== code) return v;
  }
  if (error?.message) return error.message;
  return t("errors.default", "Something went wrong.");
}

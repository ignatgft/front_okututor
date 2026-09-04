export const ERROR_CODE_KEYS: Record<string, string> = {
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

export function extractErrorCode(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  const rec = error as Record<string, unknown>;
  const code = rec["code"];
  const err = rec["error"];
  if (typeof code === "string" && code) return code;
  if (typeof err === "string" && err) return err;
  return null;
}

export function getErrorMessage(error: unknown, t: (key: string, fallback?: string) => string): string {
  let code = extractErrorCode(error);
  const rec = error as Record<string, unknown> | null | undefined;
  const msg = rec?.["message"];
  if (!code && typeof msg === "string" && /^[A-Z_]+$/.test(msg)) {
    code = msg;
  }
  if (code && ERROR_CODE_KEYS[code]) {
    return t(ERROR_CODE_KEYS[code], "");
  }
  if (code && typeof code === "string" && code.startsWith("errors.")) {
    const v = t(code, "");
    if (v && v !== code) return v;
  }
  if (code) {
    const direct = t(`errors.${code}`, "");
    if (direct && direct !== `errors.${code}`) return direct;
    const camel = code.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    const camelKey = `errors.${camel}`;
    const v2 = t(camelKey, "");
    if (v2 && v2 !== camelKey) return v2;
    const v3 = t(code, "");
    if (v3 && v3 !== code) return v3;
  }
  if (typeof msg === "string" && msg && !/^[A-Z_]+$/.test(msg)) return msg;
  if (code && /^[A-Z_]+$/.test(code)) {
    const fallback = t("errors.invalidApplicationState", "");
    if (fallback && fallback !== "errors.invalidApplicationState") return fallback;
  }
  if (typeof msg === "string" && msg) return msg;
  return t("errors.default", "Something went wrong.");
}

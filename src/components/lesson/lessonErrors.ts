export function resolveLessonJoinError(err: unknown, t: (key: string, fallback: string) => string): string {
  const rec = err as Record<string, unknown> | null | undefined;
  const status = Number(rec?.["status"] ?? 0) || 0;
  switch (status) {
    case 401:
      return t("lesson.errors.session_expired", "Your session has expired. Please sign in again.");
    case 403:
      return t("lesson.errors.forbidden", "You do not have access to this lesson.");
    case 404:
      return t("lesson.errors.not_found", "Lesson not found. It may have been cancelled.");
    case 409:
      return t("lesson.errors.conflict", "Failed to connect to the lesson. Please try opening it again.");
    default:
      return t("lesson.errors.connect", "Failed to connect to the lesson. Please try opening it again.");
  }
}

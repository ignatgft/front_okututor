import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/http";
import { useToast } from "../../components/ui/Toast";
import { scheduleKeys } from "./useScheduleQueries";
import { extractError } from "../../utils/apiHelpers";
import type { ScheduleAction, ActionButton } from "../../types/schedule";

const VALID_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Executes a ScheduleAction button. Buttons with GET-style endpoints
 * (client routes starting with "/") are treated as navigation by the caller;
 * this hook handles API mutations carried by ActionButton {endpoint, method}.
 */
export function useScheduleActionHandler(onNavigate?: (route: string) => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const runAction = useCallback(
    async (button: ActionButton, action: ScheduleAction): Promise<void> => {
      // Client-side route (e.g. /student/requests/123) — not an API call.
      // API endpoints always start with /api/.
      if (!button.endpoint.startsWith("/api/")) {
        onNavigate?.(button.endpoint);
        return;
      }

      const method = VALID_METHODS.has(button.method) ? button.method : "POST";
      setPendingId(action.id);
      try {
        const { response, data } = await apiClient.request(method, button.endpoint);
        if (!response.ok) {
          throw new Error(extractError(data) ?? t("schedule.action.failed", "Не удалось выполнить действие"));
        }
        queryClient.invalidateQueries({ queryKey: scheduleKeys.actions() });
        queryClient.invalidateQueries({ queryKey: scheduleKeys.nextLesson() });
        queryClient.invalidateQueries({ queryKey: scheduleKeys.mySchedule() });
        toast.success(t("schedule.action.success", "Действие выполнено"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg || (t("errors.default", "Something went wrong.") as string));
      } finally {
        setPendingId(null);
      }
    },
    [queryClient, toast, t, onNavigate]
  );

  return { runAction, pendingId };
}

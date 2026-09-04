import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ActionRequiredBlock } from "../../../components/schedule";
import { useToast } from "../../../components/ui/Toast";
import { useAcceptAction, useRejectAction } from "../../../hooks/schedule/useScheduleMutations";
import type { EnrollmentDTO } from "../../../types/api";
import { ENROLLMENT_STATUS } from "../../../constants/enums";

export interface ActionRequiredWidgetProps {
  enrollments: EnrollmentDTO[];
}

export function ActionRequiredWidget({ enrollments }: ActionRequiredWidgetProps): JSX.Element | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const accept = useAcceptAction();
  const reject = useRejectAction();

  const actions = useMemo(() => {
    return enrollments
      .filter((e) =>
        e.status === ENROLLMENT_STATUS.SCHEDULE_PENDING ||
        e.status === ENROLLMENT_STATUS.SCHEDULE_PROPOSED ||
        e.status === ENROLLMENT_STATUS.PENDING
      )
      .slice(0, 3)
      .map((e) => ({
        id: String(e.id),
        type: "SCHEDULE_NEGOTIATION" as const,
        title: t("schedule.action.negotiation", "Согласовать расписание") as string,
        description: t("schedule.action.negotiation_desc", "{{tutor}} предложил время для {{course}}", { tutor: (e.teacher_name as string) || "Тьютор", course: (e.course_title as string) || "Курс" }) as string,
        courseId: String(e.course_id ?? ""),
        courseTitle: (e.course_title as string) ?? "",
        tutorId: String((e as unknown as Record<string, unknown>)["teacher_id"] ?? ""),
        tutorName: (e.teacher_name as string) ?? "",
        tutorAvatar: (e as unknown as Record<string, unknown>)["teacher_avatar"] as string | undefined,
        primaryAction: { label: t("schedule.action.confirm", "Подтвердить") as string, endpoint: `/api/v1/enrollments/${e.id}/confirm`, method: "POST" as const, variant: "primary" as const },
        secondaryAction: { label: t("schedule.action.view", "Открыть") as string, endpoint: `/student/requests/${e.id}`, method: "GET" as const, variant: "secondary" as const },
        createdAt: (e.created_at as string) ?? new Date().toISOString(),
      }));
  }, [enrollments, t]);

  if (actions.length === 0) return null;

  const handleAction = async (action: { endpoint: string; method: string; label: string }, scheduleAction: unknown): Promise<void> => {
    const act = action as { endpoint: string; method: string };
    if (act.method === "GET") {
      navigate(act.endpoint);
      return;
    }
    // POST — вызываем соответствующий mutation по endpoint, вместо console.log
    try {
      const id = (scheduleAction as Record<string, unknown>)?.["id"] as string | undefined ?? act.endpoint.split("/")[4];
      if (act.endpoint.includes("/confirm")) {
        await accept.mutateAsync({ actionId: id, endpoint: act.endpoint });
      } else if (act.endpoint.includes("/reject")) {
        await reject.mutateAsync({ actionId: id, endpoint: act.endpoint });
      } else {
        // generic POST — используем accept как fallback
        await accept.mutateAsync({ actionId: id, endpoint: act.endpoint });
      }
      toast.success(t("schedule.action.success", "Действие выполнено") as string);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || (t("errors.default", "Something went wrong.") as string));
    }
  };

  return <ActionRequiredBlock actions={actions} onActionClick={handleAction as never} />;
}

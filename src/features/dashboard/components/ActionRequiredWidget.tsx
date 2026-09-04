import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ActionRequiredBlock } from "../../../components/schedule";
import { useScheduleActionHandler } from "../../../hooks/schedule";
import { endpoints } from "../../../api/endpoints";
import type { EnrollmentDTO } from "../../../types/api";
import { ENROLLMENT_STATUS } from "../../../constants/enums";

export interface ActionRequiredWidgetProps {
  enrollments: EnrollmentDTO[];
}

export function ActionRequiredWidget({ enrollments }: ActionRequiredWidgetProps): JSX.Element | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { runAction, pendingId } = useScheduleActionHandler(navigate);

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
        primaryAction: { label: t("schedule.action.confirm", "Подтвердить") as string, endpoint: endpoints.enrollments.accept(e.id), method: "POST" as const, variant: "primary" as const },
        secondaryAction: { label: t("schedule.action.view", "Открыть") as string, endpoint: `/student/requests/${e.id}`, method: "GET" as const, variant: "secondary" as const },
        createdAt: (e.created_at as string) ?? new Date().toISOString(),
      }));
  }, [enrollments, t]);

  if (actions.length === 0) return null;

  return <ActionRequiredBlock actions={actions} onActionClick={runAction} pendingActionId={pendingId} />;
}

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { formatInTimezone, formatTimeInTimezone } from "../../utils/timezone";
import type { ScheduleAction, ActionButton } from "../../types/schedule";
import "./ActionRequiredBlock.css";

interface ActionRequiredBlockProps {
  actions: ScheduleAction[];
  onActionClick: (action: ActionButton, scheduleAction: ScheduleAction) => void | Promise<void>;
  pendingActionId?: string | null;
}

const ActionTypeLabels: Record<ScheduleAction["type"], string> = {
  SCHEDULE_NEGOTIATION: "schedule.action.negotiation",
  RESCHEDULE_CONFIRMATION: "schedule.action.reschedule_confirmation",
  TIME_PROPOSAL: "schedule.action.time_proposal",
  APPLICATION_CONFIRMATION: "schedule.action.application_confirmation",
  PAYMENT_REQUIRED: "schedule.action.payment_required",
  LESSON_CONFIRMATION: "schedule.action.lesson_confirmation",
};

const ActionTypeIcons: Record<ScheduleAction["type"], string> = {
  SCHEDULE_NEGOTIATION: "🤝",
  RESCHEDULE_CONFIRMATION: "🔄",
  TIME_PROPOSAL: "⏰",
  APPLICATION_CONFIRMATION: "📝",
  PAYMENT_REQUIRED: "💳",
  LESSON_CONFIRMATION: "✅",
};

export const ActionRequiredBlock = memo(function ActionRequiredBlock({ actions, onActionClick, pendingActionId }: ActionRequiredBlockProps) {
  const { t } = useTranslation();

  if (!actions.length) return null;

  return (
    <section className="action-required-block" aria-labelledby="action-required-title">
      <header className="action-required-header">
        <h2 id="action-required-title" className="action-required-title">
          <span className="title-icon" aria-hidden="true">⚠️</span>
          {t("schedule.action_required", "Требуется действие")}
        </h2>
        <span className="action-count" aria-label={`${actions.length} действий`}>
          {actions.length}
        </span>
      </header>

      <div className="action-required-list" role="list">
        {actions.map((action) => (
          <article key={action.id} className="action-card" role="listitem">
            <div className="action-card-icon" aria-hidden="true">
              {ActionTypeIcons[action.type]}
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">{t(ActionTypeLabels[action.type], action.title)}</h3>
              <p className="action-card-description">{action.description}</p>

              <div className="action-card-meta">
                <span className="action-course">
                  <span className="meta-label">{t("schedule.course", "Курс")}:</span>
                  <span className="meta-value">{action.courseTitle}</span>
                </span>
                <span className="action-tutor">
                  <span className="meta-label">{t("schedule.tutor", "Тьютор")}:</span>
                  <span className="meta-value">{action.tutorName}</span>
                </span>
                {action.proposedStartAt && (
                  <span className="action-time">
                    <span className="meta-label">{t("schedule.proposed_time", "Предлагаемое время")}:</span>
                    <span className="meta-value">
                      {formatInTimezone(action.proposedStartAt, action.timezone || "UTC", "ru", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {action.proposedEndAt && (
                        <>
                          {" "}
                          {formatTimeInTimezone(action.proposedStartAt, action.timezone || "UTC")}–{" "}
                          {formatTimeInTimezone(action.proposedEndAt, action.timezone || "UTC")}
                        </>
                      )}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="action-card-actions">
              <button
                type="button"
                className={`btn-${action.primaryAction.variant} action-btn-primary`}
                disabled={pendingActionId === action.id}
                onClick={() => void onActionClick(action.primaryAction, action)}
              >
                {pendingActionId === action.id ? t("common.loading", "Загрузка...") : t(action.primaryAction.label, action.primaryAction.label)}
              </button>
              {action.secondaryAction && (
                <button
                  type="button"
                  className={`btn-${action.secondaryAction.variant} action-btn-secondary`}
                  disabled={pendingActionId === action.id}
                  onClick={() => void onActionClick(action.secondaryAction!, action)}
                >
                  {t(action.secondaryAction.label, action.secondaryAction.label)}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

ActionRequiredBlock.displayName = "ActionRequiredBlock";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { computeCommonSlots } from "../../utils/commonSlots";
import type { AvailabilitySlot } from "../../types/api";

const DAY_KEY: Record<string, string> = {
  monday: "application.days_monday",
  tuesday: "application.days_tuesday",
  wednesday: "application.days_wednesday",
  thursday: "application.days_thursday",
  friday: "application.days_friday",
  saturday: "application.days_saturday",
  sunday: "application.days_sunday",
};

export interface MutualSlot {
  weekday: string;
  start: string;
  end: string;
}

export interface MutualAvailabilityProps {
  tutorAvailability?: AvailabilitySlot[];
  studentInput?: Record<string, unknown>;
  onPick?: (slot: MutualSlot) => void;
}

export function MutualAvailability({ tutorAvailability = [], studentInput = {}, onPick }: MutualAvailabilityProps): JSX.Element {
  const { t } = useTranslation();
  const slots = useMemo(
    () => computeCommonSlots(tutorAvailability as unknown as AvailabilitySlot[], studentInput as unknown as Record<string, unknown>) as MutualSlot[],
    [tutorAvailability, studentInput]
  );

  if (slots.length === 0) {
    return (
      <div className="mutual-availability empty">
        {t("schedule_agreement.no_options", "No common time options found")}
      </div>
    );
  }

  return (
    <div className="mutual-availability">
      <p className="mutual-title">{t("schedule_agreement.options", "Available options")}</p>
      <div className="mutual-slots">
        {slots.map((s) => (
          <button
            key={`${s.weekday}-${s.start}-${s.end}`}
            type="button"
            className="mutual-slot"
            onClick={() => onPick?.(s)}
          >
            ☑ {t(DAY_KEY[s.weekday] || s.weekday)} {s.start}–{s.end}
          </button>
        ))}
      </div>
    </div>
  );
}

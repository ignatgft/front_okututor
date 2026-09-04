import { useTranslation } from "react-i18next";
import { generateSlotTimes } from "../../utils/slots";
import "../../styles/SlotPicker.css";
import type { AvailabilitySlot } from "../../types/api";

export interface SlotPickerProps {
  date: Date | null;
  availability?: AvailabilitySlot[];
  selected?: string | null;
  onSelect?: (time: string) => void;
  disabled?: boolean;
  step?: number;
}

export function SlotPicker({
  date,
  availability = [],
  selected,
  onSelect,
  disabled = false,
  step,
}: SlotPickerProps): JSX.Element {
  const { t } = useTranslation();
  const times = generateSlotTimes(availability as unknown as AvailabilitySlot[], date, { step });

  if (times.length === 0) {
    return (
      <p className="slot-picker-empty">{t("booking.no_slots", "No available slots on this date")}</p>
    );
  }

  return (
    <div className="slot-picker" role="listbox" aria-label={t("booking.select_slot", "Select time")}>
      {times.map((tm) => {
        const active = selected === tm;
        return (
          <button
            key={tm}
            type="button"
            role="option"
            aria-selected={active}
            className={`slot-chip${active ? " slot-chip-active" : ""}`}
            onClick={() => onSelect?.(tm)}
            disabled={disabled}
          >
            {tm}
          </button>
        );
      })}
    </div>
  );
}

export default SlotPicker;

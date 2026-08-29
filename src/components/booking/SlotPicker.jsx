import { useTranslation } from "react-i18next";
import { generateSlotTimes } from "../../utils/slots";
import "../../styles/SlotPicker.css";

/**
 * Renders selectable time chips for a chosen date based on the tutor's
 * availability slots. Pure presentational component — the parent owns state
 * and the actual booking submit.
 */
export function SlotPicker({
  date,
  availability = [],
  selected,
  onSelect,
  disabled = false,
  step,
}) {
  const { t } = useTranslation();
  const times = generateSlotTimes(availability, date, { step });

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

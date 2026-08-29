import "../../styles/ui.css";

const emptyValue = () => ({ date: "", time: "" });

export function DateTimePicker({ value = emptyValue(), onChange, minDate, id, ariaLabel, className = "" }) {
  const handleDate = (e) => onChange?.({ date: e.target.value, time: value.time });
  const handleTime = (e) => onChange?.({ date: value.date, time: e.target.value });

  return (
    <div className={`datetime-picker ${className}`}>
      <input
        id={id}
        type="date"
        className="datetime-picker-date"
        value={value.date || ""}
        onChange={handleDate}
        min={minDate}
        aria-label={ariaLabel || "date"}
      />
      <input
        type="time"
        className="datetime-picker-time"
        value={value.time || ""}
        onChange={handleTime}
        aria-label={ariaLabel || "time"}
      />
    </div>
  );
}

export default DateTimePicker;

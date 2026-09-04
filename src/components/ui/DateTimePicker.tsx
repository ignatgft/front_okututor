import "../../styles/ui.css";

export interface DateTimeValue {
  date: string;
  time: string;
}

export interface DateTimePickerProps {
  value?: DateTimeValue;
  onChange?: (value: DateTimeValue) => void;
  minDate?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

const emptyValue = (): DateTimeValue => ({ date: "", time: "" });

export function DateTimePicker({ value = emptyValue(), onChange, minDate, id, ariaLabel, className = "" }: DateTimePickerProps): JSX.Element {
  const handleDate = (e: React.ChangeEvent<HTMLInputElement>): void => onChange?.({ date: e.target.value, time: value.time });
  const handleTime = (e: React.ChangeEvent<HTMLInputElement>): void => onChange?.({ date: value.date, time: e.target.value });

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

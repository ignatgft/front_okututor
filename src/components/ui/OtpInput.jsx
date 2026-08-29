import { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/OtpInput.css";

const OTP_LENGTH = 6;

/**
 * 6-cell OTP input with paste, auto-focus, and keyboard navigation.
 *
 * @param {{ value: string, onChange: (v: string) => void, onComplete?: (v: string) => void, disabled?: boolean, error?: boolean, autoFocus?: boolean }}
 */
export default function OtpInput({ value = "", onChange, onComplete, disabled = false, error = false, autoFocus = true }) {
  const { t } = useTranslation();
  const inputRefs = useRef([]);
  const digits = value.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH);

  const focusInput = useCallback((index) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleChange = useCallback((e, index) => {
    if (disabled) return;
    const input = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = input;
    const newValue = newDigits.join("");
    onChange(newValue);

    if (input && index < OTP_LENGTH - 1) {
      setTimeout(() => focusInput(index + 1), 0);
    }
    if (newValue.length === OTP_LENGTH && onComplete) {
      setTimeout(() => onComplete(newValue), 0);
    }
  }, [digits, onChange, onComplete, disabled, focusInput]);

  const handleKeyDown = useCallback((e, index) => {
    if (disabled) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        setTimeout(() => focusInput(index - 1), 0);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  }, [digits, onChange, disabled, focusInput]);

  const handlePaste = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      setTimeout(() => focusInput(nextIndex), 0);
      if (pasted.length === OTP_LENGTH && onComplete) {
        setTimeout(() => onComplete(pasted), 0);
      }
    }
  }, [disabled, onChange, onComplete, focusInput]);

  return (
    <div
      className={`otp-input-group${error ? " otp-input-error" : ""}`}
      role="group"
      aria-label={t("a11y.one_time_code", "One-time code")}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          className="otp-input-cell"
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
          autoFocus={autoFocus && i === 0 && !value}
        />
      ))}
    </div>
  );
}

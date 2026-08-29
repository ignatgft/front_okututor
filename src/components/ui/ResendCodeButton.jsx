import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * "Resend code" button with countdown.
 * @param {{ resendAvailableIn: number, onResend: () => Promise<void>, loading: boolean }}
 */
export default function ResendCodeButton({ resendAvailableIn = 60, onResend, loading = false }) {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, resendAvailableIn));

  useEffect(() => {
    setSecondsLeft(Math.max(0, resendAvailableIn));
  }, [resendAvailableIn]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleResend = useCallback(async () => {
    if (secondsLeft > 0 || loading) return;
    await onResend();
  }, [secondsLeft, loading, onResend]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}`;
  };

  if (secondsLeft > 0) {
    return (
      <span className="resend-code-disabled">
        {t("verify.resend_in", "Resend in {{time}}", { time: formatTime(secondsLeft) })}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="resend-code-btn"
      onClick={handleResend}
      disabled={loading}
    >
      {loading ? t("common.sending", "Sending...") : t("verify.resend", "Resend code")}
    </button>
  );
}

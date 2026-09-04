// migrated to TSX — minimal strict types (controlled)
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, EMAIL_ERROR_CODES } from "../api/auth.api";
import OtpInput from "../components/ui/OtpInput";
import ResendCodeButton from "../components/ui/ResendCodeButton";
import "../styles/AuthForms.css";

const STEP = { EMAIL: "email", CODE: "code", NEW_PASSWORD: "password", DONE: "done" };

export default function PgForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState(null);
  const [resendAvailableIn, setResendAvailableIn] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmitEmail = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t("auth_forgot.error_email", "Please enter your email"));
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep(STEP.CODE);
      setCode("");
    } catch (err) {
      setError(err.message || t("auth_forgot.error_default", "Failed to send reset code"));
    } finally {
      setLoading(false);
    }
  }, [email, t]);

  const handleVerifyCode = useCallback(async (otp) => {
    if (!otp || otp.length !== 6) return;
    setError("");
    setErrorCode(null);
    setLoading(true);
    try {
      const { response, data } = await authApi.verifyResetCode(email, otp);
      if (response.ok) {
        setStep(STEP.NEW_PASSWORD);
      } else {
        const code2 = data?.error || null;
        setErrorCode(code2);
        if (code2 === EMAIL_ERROR_CODES.TOO_MANY_ATTEMPTS) {
          setError(t("errors.too_many_attempts", "Too many attempts. Request a new code."));
        } else if (code2 === EMAIL_ERROR_CODES.VERIFICATION_CODE_EXPIRED) {
          setError(t("errors.expired", "Code expired. Request a new one."));
        } else if (code2 === EMAIL_ERROR_CODES.INVALID_CODE) {
          setError(t("errors.invalid_code", "Invalid code. Please try again."));
        } else {
          setError(data?.message || t("errors.default", "Something went wrong."));
        }
      }
    } catch (err) {
      setErrorCode(err.code || EMAIL_ERROR_CODES.NETWORK);
      setError(err.message || t("errors.network", "Network error."));
    } finally {
      setLoading(false);
    }
  }, [email, t]);

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setError("");
    setErrorCode(null);
    try {
      const { response, data } = await authApi.resendResetCode(email);
      if (response.ok) {
        setResendAvailableIn(data?.resendAvailableIn || 60);
        setCode("");
      } else {
        if (data?.error === "RATE_LIMITED" || response.status === 429) {
          setErrorCode(EMAIL_ERROR_CODES.RATE_LIMITED);
          setError(t("errors.rate_limited", "Too many requests. Please wait."));
          setResendAvailableIn(data?.resendAvailableIn || 60);
        } else {
          setError(data?.message || t("errors.default", "Failed to resend code."));
        }
      }
    } catch (err) {
      setError(err.message || t("errors.network", "Network error."));
    } finally {
      setResendLoading(false);
    }
  }, [email, t]);

  const handleResetPassword = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("auth_reset.error_length", "Password must be at least 8 characters"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth_register.passwords_no_match", "Passwords do not match"));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, new_password: password });
      setStep(STEP.DONE);
    } catch (err) {
      setError(err.message || t("auth_reset.error_default", "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  }, [email, code, password, confirmPassword, t]);

  return (
    <div className="auth-form-page">
      <div className="auth-form-card">
        {step === STEP.EMAIL && (
          <>
            <h1>{t("auth_forgot.title", "Forgot password")}</h1>
            <p className="auth-form-hint">
              {t("auth_forgot.hint", "Enter your email and we'll send you a code to reset your password.")}
            </p>
            {error && <p className="auth-form-error" role="alert">{error}</p>}
            <form onSubmit={handleSubmitEmail}>
              <div className="auth-form-field">
                <label htmlFor="forgot-email">{t("common.email", "Email")}</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="auth-form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? t("common.sending", "Sending...") : t("auth_forgot.submit", "Send code")}
                </button>
                <Link to="/login" className="auth-form-link">
                  {t("auth_forgot.back_to_login", "Back to login")}
                </Link>
              </div>
            </form>
          </>
        )}

        {step === STEP.CODE && (
          <>
            <h1>{t("verify.title", "Check your email")}</h1>
            <p className="auth-form-hint">
              {t("auth_forgot.code_sent", "We sent a 6-digit code to")} <strong>{email}</strong>
            </p>
            {error && <p className="auth-form-error" role="alert">{error}</p>}
            <form onSubmit={(e) => e.preventDefault()}>
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={handleVerifyCode}
                disabled={loading}
                error={!!errorCode}
                autoFocus
              />
              <div className="auth-form-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleVerifyCode(code)}
                  disabled={loading || code.length !== 6}
                >
                  {loading ? t("common.loading", "Loading...") : t("verify.confirm", "Verify")}
                </button>
              </div>
            </form>
            <div className="auth-form-actions" style={{ marginTop: "var(--space-4)" }}>
              <ResendCodeButton
                resendAvailableIn={resendAvailableIn}
                onResend={handleResend}
                loading={resendLoading}
              />
            </div>
            <div className="auth-form-actions" style={{ marginTop: "var(--space-3)" }}>
              <Link to="/login" className="auth-form-link">
                {t("auth_forgot.back_to_login", "Back to login")}
              </Link>
            </div>
          </>
        )}

        {step === STEP.NEW_PASSWORD && (
          <>
            <h1>{t("auth_reset.title", "Reset password")}</h1>
            <p className="auth-form-hint">
              {t("auth_reset.new_password_hint", "Enter your new password below.")}
            </p>
            {error && <p className="auth-form-error" role="alert">{error}</p>}
            <form onSubmit={handleResetPassword}>
              <div className="auth-form-field">
                <label htmlFor="reset-password">{t("auth_register.password", "New password")}</label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="auth-form-field">
                <label htmlFor="reset-confirm">{t("auth_register.repeat_password", "Confirm password")}</label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="auth-form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? t("common.saving", "Saving...") : t("auth_reset.submit", "Update password")}
                </button>
              </div>
            </form>
          </>
        )}

        {step === STEP.DONE && (
          <>
            <div className="verify-success-icon">✓</div>
            <h1>{t("success.password_changed", "Password changed!")}</h1>
            <p className="auth-form-hint">
              {t("auth_reset.success_hint", "You can now log in with your new password.")}
            </p>
            <div className="auth-form-actions">
              <button type="button" className="btn-primary" onClick={() => navigate("/login")}>
                {t("auth_forgot.back_to_login", "Back to login")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

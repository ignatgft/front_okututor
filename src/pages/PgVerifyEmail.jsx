import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, EMAIL_ERROR_CODES } from "../api/auth.api";
import { setTokens } from "../api/token";
import useAuthStore from "../store/authStore";
import OtpInput from "../components/ui/OtpInput";
import ResendCodeButton from "../components/ui/ResendCodeButton";
import { maskEmail } from "../utils/maskEmail";
import "../styles/AuthForms.css";

const VERIFY_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

export default function PgVerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, login: storeLogin } = useAuthStore();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [verifyState, setVerifyState] = useState(VERIFY_STATES.IDLE);
  const [error, setError] = useState("");
  const [resendAvailableIn, setResendAvailableIn] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);

  const returnUrl = location.state?.returnUrl || "/";

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  const handleVerify = useCallback(async (otp) => {
    if (!email || otp.length !== 6) return;
    setVerifyState(VERIFY_STATES.LOADING);
    setError("");
    try {
      const { response, data } = await authApi.verifyEmail(email, otp);
      if (response.ok && data?.status === "EMAIL_VERIFIED") {
        if (data.access_token) setTokens(data.access_token, data.refresh_token);
        if (data.user) {
          storeLogin(data.user);
        } else {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            setUser({ ...currentUser, verified: true });
          } else {
            navigate("/login", { replace: true });
          }
        }
        setVerifyState(VERIFY_STATES.SUCCESS);
        setTimeout(() => {
          navigate(returnUrl, { replace: true });
        }, 1500);
      } else {
        const code2 = data?.error || null;
        if (code2 === EMAIL_ERROR_CODES.TOO_MANY_ATTEMPTS) {
          setError(t("errors.too_many_attempts", "Too many attempts. Request a new code."));
        } else if (code2 === EMAIL_ERROR_CODES.VERIFICATION_CODE_EXPIRED) {
          setError(t("errors.expired", "Code expired. Request a new one."));
        } else if (code2 === EMAIL_ERROR_CODES.INVALID_CODE) {
          setError(t("errors.invalid_code", "Invalid code. Please try again."));
        } else {
          setError(data?.message || t("errors.default", "Something went wrong."));
        }
        setVerifyState(VERIFY_STATES.ERROR);
      }
    } catch (err) {
      setError(err.message || t("errors.network", "Network error. Check your connection."));
      setVerifyState(VERIFY_STATES.ERROR);
    }
  }, [email, navigate, returnUrl, t, setUser, storeLogin]);

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setError("");
    try {
      const { response, data } = await authApi.resendVerification(email);
      if (response.ok) {
        setResendAvailableIn(data?.resendAvailableIn || 60);
        setCode("");
        setVerifyState(VERIFY_STATES.IDLE);
      } else {
        if (data?.error === "RATE_LIMITED" || response.status === 429) {
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

  const handleChangeEmail = useCallback(async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return;
    setChangeEmailLoading(true);
    try {
      const { response, data } = await authApi.changeEmail(newEmail);
      if (response.ok) {
        setEmail(newEmail);
        setNewEmail("");
        setShowChangeEmail(false);
        setCode("");
        setVerifyState(VERIFY_STATES.IDLE);
        setResendAvailableIn(data?.resendAvailableIn || 60);
      } else {
        setError(data?.message || t("errors.default", "Failed to change email."));
      }
    } catch (err) {
      setError(err.message || t("errors.network", "Network error."));
    } finally {
      setChangeEmailLoading(false);
    }
  }, [newEmail, t]);

  if (verifyState === VERIFY_STATES.SUCCESS) {
    return (
      <div className="auth-form-page">
        <div className="auth-form-card">
          <div className="verify-success-icon">✓</div>
          <h1>{t("success.email_verified", "Email verified!")}</h1>
          <p className="auth-form-hint">
            {t("verify.success_redirect", "Redirecting you to the dashboard...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-page">
      <div className="auth-form-card">
        <div className="verify-email-icon">✉</div>
        <h1>{t("verify.title", "Check your email")}</h1>
        <p className="auth-form-hint">
          {t("verify.subtitle", "We sent a 6-digit code to")}{" "}
          <strong>{maskEmail(email)}</strong>
        </p>

        {error && <p className="auth-form-error" role="alert">{error}</p>}

        <form onSubmit={(e) => e.preventDefault()}>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={handleVerify}
            disabled={verifyState === VERIFY_STATES.LOADING}
            error={verifyState === VERIFY_STATES.ERROR}
            autoFocus
          />

          <div className="auth-form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleVerify(code)}
              disabled={verifyState === VERIFY_STATES.LOADING || code.length !== 6}
            >
              {verifyState === VERIFY_STATES.LOADING
                ? t("common.loading", "Loading...")
                : t("verify.confirm", "Verify")}
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

        {showChangeEmail ? (
          <form className="auth-form-card-inner" onSubmit={handleChangeEmail} style={{ marginTop: "var(--space-4)" }}>
            <div className="auth-form-field">
              <label htmlFor="change-email">{t("verify.new_email", "New email")}</label>
              <input
                id="change-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-form-actions">
              <button type="submit" className="btn-primary" disabled={changeEmailLoading}>
                {changeEmailLoading ? t("common.sending", "Sending...") : t("verify.change_email", "Change email")}
              </button>
              <button type="button" className="auth-form-link" onClick={() => setShowChangeEmail(false)}>
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ marginTop: "var(--space-3)", textAlign: "center" }}>
            <button
              type="button"
              className="auth-form-link"
              onClick={() => setShowChangeEmail(true)}
            >
              {t("verify.change_email", "Change email")}
            </button>
          </div>
        )}

        <div className="auth-form-actions" style={{ marginTop: "var(--space-4)" }}>
          <Link to="/login" className="auth-form-link">
            {t("auth_forgot.back_to_login", "Back to login")}
          </Link>
        </div>
      </div>
    </div>
  );
}

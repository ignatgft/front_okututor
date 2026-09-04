// migrated to TSX — minimal strict types (controlled)
import { useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth.api";
import "../styles/AuthForms.css";

export default function PgResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const validate = useCallback(() => {
    if (password.length < 8) return t("auth_reset.error_length", "Password must be at least 8 characters");
    if (password !== confirmPassword) return t("auth_register.passwords_no_match", "Passwords do not match");
    return "";
  }, [password, confirmPassword, t]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, email, new_password: password });
      setDone(true);
    } catch (err) {
      setError(err.message || t("auth_reset.error_default", "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  }, [token, email, password, validate, t]);

  if (done) {
    return (
      <div className="auth-form-page">
        <div className="auth-form-card">
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
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-page">
      <div className="auth-form-card">
        <h1>{t("auth_reset.title", "Reset password")}</h1>
        {!token ? (
          <>
            <p className="auth-form-hint">
              {t("auth_reset.missing_token", "This link is invalid or incomplete. Request a new reset link.")}
            </p>
            <div className="auth-form-actions">
              <Link to="/forgot-password" className="btn-primary">
                {t("auth_forgot.title", "Forgot password")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="auth-form-hint">
              {t("auth_reset.new_password_hint", "Enter your new password below.")}
            </p>
            {error && <p className="auth-form-error" role="alert">{error}</p>}
            <form onSubmit={handleSubmit}>
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
                <Link to="/forgot-password" className="auth-form-link">
                  {t("auth_forgot.title", "Forgot password")}
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

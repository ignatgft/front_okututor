// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login as apiLogin, buildGoogleOAuthUrl } from "../../api/auth";
import useAuthStore from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { isTutorLike } from "../../constants/roles";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import Modal from "./Modal";
import "../../styles/AuthRegister/Auth.css";

export default function Auth({ isOpen, onClose, onSuccess }: Record<string, unknown>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, init } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = t("validation.required", "Required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("validation.invalid_email", "Invalid email");
    }

    if (!password) {
      errors.password = t("validation.required", "Required");
    }

    return errors;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
    if (emailNotVerified) setEmailNotVerified(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const result = await apiLogin(email, password);
      if (result.emailNotVerified) {
        setEmailNotVerified(true);
        return;
      }
      setUser(result.user);
      await init();
      onClose();
      if (isTutorLike(result.user?.role)) {
        navigate("/tutor/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = buildGoogleOAuthUrl();
  };

  const handleGoToVerify = () => {
    onClose();
    navigate("/verify-email", {
      replace: true,
      state: { email }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2>{t("navbar.login") || "Login"}</h2>

        {error && <div className="auth-error">{error}</div>}

        {emailNotVerified && (
          <div className="auth-email-not-verified" role="alert">
            <p>{t("login.email_not_verified", "Email not yet verified. Check your inbox for a verification code.")}</p>
            <button type="button" className="btn-primary" onClick={handleGoToVerify}>
              {t("verify.confirm", "Verify email")}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <input
              type="email"
              placeholder={t("cr_course.email") || "Email"}
              value={email}
              onChange={handleEmailChange}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-field">
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("cr_course.password") || "Password"}
                value={password}
                onChange={handlePasswordChange}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="password-error" className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "..." : t("navbar.login") || "Login"}
          </button>
        </form>

        <p className="auth-switch">
          <button
            type="button"
            className="link-btn"
            onClick={() => { onClose(); navigate("/forgot-password"); }}
          >
            {t("auth.forgot_password", "Forgot password?")}
          </button>
        </p>

        <div className="auth-divider"><span>OR</span></div>

        <button className="google-btn" onClick={handleGoogleLogin} type="button">
          <img src={googleIcon} alt="Google" width={20} />
          Google
        </button>

        <p className="auth-switch">
          {t("auth.no_account") || "Don't have an account?"}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => { onClose(); useUIStore.getState().openRegister(); }}
          >
            {t("navbar.signup") || "Sign Up"}
          </button>
        </p>
      </div>
    </Modal>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { register as apiRegister, buildGoogleOAuthUrl } from "../../api/auth";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import { ROLES, isTutorLike } from "../../constants/roles";
import { useUIStore } from "../../store/uiStore";
import useAuthStore from "../../store/authStore";
import Modal from "./Modal";
import "../../styles/AuthRegister/Register.css";

export default function Register({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, init } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    repeatPassword: ""
  });
  const [role, setRole] = useState(ROLES.STUDENT);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = t("validation.required", "Required");
    }

    if (!formData.email.trim()) {
      errors.email = t("validation.required", "Required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("validation.invalid_email", "Invalid email");
    }

    if (!formData.password) {
      errors.password = t("validation.required", "Required");
    } else if (formData.password.length < 8) {
      errors.password = t("validation.password_min", "Minimum 8 characters");
    }

    if (formData.password !== formData.repeatPassword) {
      errors.repeatPassword = t("validation.password_match", "Passwords do not match");
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const result = await apiRegister(
        formData.email,
        formData.password,
        formData.repeatPassword,
        formData.fullName,
        role
      );
      if (result.emailVerificationRequired) {
        onClose();
        navigate("/verify-email", {
          replace: true,
          state: { email: result.email || formData.email }
        });
      } else {
        setUser(result.user);
        await init();
        onClose();
        navigate(isTutorLike(result.user?.role) ? "/tutor/dashboard" : "/student/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = buildGoogleOAuthUrl(role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2>{t("navbar.signup") || "Sign Up"}</h2>

        {error && <div className="auth-error">{error}</div>}

        <div className="role-selection">
          <span className="role-selection-label">{t("register.join_as", "I want to join as")}</span>
          <div className="role-options" role="radiogroup" aria-label={t("register.join_as", "I want to join as")}>
            <button
              type="button"
              className={`role-option ${role === ROLES.STUDENT ? "active" : ""}`}
              onClick={() => setRole(ROLES.STUDENT)}
              aria-pressed={role === ROLES.STUDENT}
            >
              <span className="role-option-icon">🎓</span>
              {t("register.student", "Student")}
            </button>
            <button
              type="button"
              className={`role-option ${role === ROLES.TUTOR ? "active" : ""}`}
              onClick={() => setRole(ROLES.TUTOR)}
              aria-pressed={role === ROLES.TUTOR}
            >
              <span className="role-option-icon">👨‍🏫</span>
              {t("register.tutor", "Tutor")}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <input
              name="fullName"
              type="text"
              placeholder={t("cr_course.full_name") || "Full Name"}
              value={formData.fullName}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.fullName}
              aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
            />
            {fieldErrors.fullName && (
              <span id="fullName-error" className="field-error">{fieldErrors.fullName}</span>
            )}
          </div>

          <div className="form-field">
            <input
              name="email"
              type="email"
              placeholder={t("common.email", "Email")}
              value={formData.email}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-field">
            <input
              name="password"
              type="password"
              placeholder={t("cr_course.password") || "Password"}
              value={formData.password}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password && (
              <span id="password-error" className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-field">
            <input
              name="repeatPassword"
              type="password"
              placeholder={t("cr_course.repeat_password") || "Repeat Password"}
              value={formData.repeatPassword}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.repeatPassword}
              aria-describedby={fieldErrors.repeatPassword ? "repeatPassword-error" : undefined}
            />
            {fieldErrors.repeatPassword && (
              <span id="repeatPassword-error" className="field-error">{fieldErrors.repeatPassword}</span>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "..." : t("navbar.signup") || "Sign Up"}
          </button>
        </form>

        <div className="auth-divider"><span>{t("auth.or") || "OR"}</span></div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleRegister}
          title={`${t("register.join_as", "I want to join as")}: ${isTutorLike(role) ? t("register.tutor", "Tutor") : t("register.student", "Student")}`}
        >
          <img src={googleIcon} alt="Google" width={20} />
          {t("register.continue_google", "Continue with Google")}
        </button>

        <p className="auth-switch">
          {t("auth.have_account") || "Already have an account?"}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => { onClose(); useUIStore.getState().openAuth(); }}
          >
            {t("navbar.login") || "Login"}
          </button>
        </p>
      </div>
    </Modal>
  );
}
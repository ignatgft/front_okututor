import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import "../../styles/AuthRegister/Auth.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import handIcon from "../../assets/AuthRegister/hand-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg";
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg";
import { buildApiUrl } from "../../api/config";
import { endpoints } from "../../api/endpoints";
import { apiFetch } from "../../api/http";
import { setToken } from "../../api/auth";

const Auth = ({ isOpen, onClose, onOpenRegister, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Add navigate hook

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { response, data: result } = await apiFetch(endpoints.auth.login, {
        method: "POST",
        body: { email: formData.email, password: formData.password },
      });
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Expecting backend to return { token, user }
      if (result.token) setToken(result.token);
      setSuccess("Login successful!");
      setTimeout(() => {
        if (onSuccess) onSuccess(navigate);
        else onClose();
        setFormData({ email: "", password: "", rememberMe: false });
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      if (error.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (error.code === "auth/user-not-found") {
        setError("User not found");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many attempts, please try again later");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else {
        setError(error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Redirect to backend Google OAuth endpoint
      const popup = window.open(buildApiUrl(endpoints.auth.google), "_blank", "width=600,height=700");
      if (!popup) throw new Error("Popup blocked");
      // The backend should handle OAuth flow and set cookie or return token to client
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-form">
        <h2>
          Welcome Back{" "}
          <span role="img" aria-label="wave">
            <img src={handIcon} alt="Hand Icon" className="hand-icon" />
          </span>
        </h2>

        <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <img src={googleIcon} alt="Google Icon" className="google-icon" />
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                <img
                  src={showPassword ? hidePasswordIcon : showPasswordIcon}
                  alt="Toggle Password Visibility"
                />
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              Remember me
            </label>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="signup-link">
          Don’t have an account?{" "}
          <a href="#" onClick={onOpenRegister}>
            Create account
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default Auth;

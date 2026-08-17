import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/AuthRegister/Register.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import mankeyIcon from "../../assets/AuthRegister/mankey-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg";
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg";
import { buildApiUrl } from "../../api/config";
import { endpoints } from "../../api/endpoints";
import { apiFetch } from "../../api/http";
import { setToken } from "../../api/auth";

const Register = ({ isOpen, onClose, onOpenAuth }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.repeatPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const { data: result } = await apiFetch(endpoints.auth.register, {
        method: "POST",
        body: {
          email: formData.email,
          password: formData.password,
          repeat_password: formData.repeatPassword,
          full_name: formData.fullName,
        },
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.token) setToken(result.token);
      setSuccess("Registration successful! You are now logged in.");
      setTimeout(() => {
        onClose();
        setFormData({ fullName: "", email: "", password: "", repeatPassword: "" });
      }, 500);
    } catch (error) {
      setError(error.message || "Registration failed");
    }
  };

  // Register.jsx
const handleGoogleSignUp = async () => {
  setError("");
  setSuccess("");
  try {
    window.open(buildApiUrl(endpoints.auth.google), "_blank", "width=600,height=700");
  } catch (error) {
    setError(error.message || "Google signup failed");
  }
};

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="register-form">
        <h2>
          Sign up now{" "}
          <span role="img" aria-label="key">
            <img src={mankeyIcon} alt="Man key Icon" className="mankey-icon" />
          </span>
        </h2>

        <button className="google-btn" onClick={handleGoogleSignUp}>
          <img src={googleIcon} alt="Google Icon" className="google-icon" />
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
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
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={showPassword ? hidePasswordIcon : showPasswordIcon}
                  alt="Toggle Password Visibility"
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="repeatPassword">Repeat password</label>
            <div className="password-input-wrapper">
              <input
                type={showRepeatPassword ? "text" : "password"}
                id="repeatPassword"
                name="repeatPassword"
                value={formData.repeatPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                aria-label={showRepeatPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={showRepeatPassword ? hidePasswordIcon : showPasswordIcon}
                  alt="Toggle Password Visibility"
                />
              </button>
            </div>
          </div>
          <button type="submit" className="submit-btn">
            Sign up
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <a href="#" onClick={onOpenAuth}>
            Sign in
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default Register;

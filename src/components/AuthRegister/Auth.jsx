import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/AuthRegister/Auth.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import handIcon from "../../assets/AuthRegister/hand-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg"; // Импортируем иконку глаза
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg"; // Опционально: иконка для "пароль виден"

const Auth = ({ isOpen, onClose, onOpenRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login data:", formData);
    // Здесь можно добавить логику для отправки данных на сервер
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // Здесь можно добавить логику для входа через Google
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

        {/* Кнопка Google */}
        <button className="google-btn" onClick={handleGoogleLogin}>
          <img src={googleIcon} alt="Google Icon" className="google-icon" />
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Форма */}
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
              >
                <img src={showPassword ? hidePasswordIcon : showPasswordIcon} alt="Toggle Password Visibility" /> 
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
              />
              Remember me
            </label>
            {/* <a href="#" className="forgot-password">
              Forgot your password?
            </a> */}
          </div>

          <button type="submit" className="submit-btn">
            Log in
          </button>
        </form>

        {/* Ссылка на регистрацию */}
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
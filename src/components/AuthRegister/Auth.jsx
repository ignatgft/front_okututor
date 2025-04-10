import React, { useState } from "react";
import "../../styles/AuthRegister/Auth.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg"; // Предполагается, что у вас есть иконка Google
import handIcon from "../../assets/AuthRegister/hand-icon.svg";

const Auth = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

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
    <div className="auth-container">
      <div className="auth-form">
        <h2>Welcome Back <span role="img" aria-label="wave">👋</span></h2>

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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
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
            <a href="#" className="forgot-password">
              Forgot your password?
            </a>
          </div>

          <button type="submit" className="submit-btn">
            Log in
          </button>
        </form>

        {/* Ссылка на регистрацию */}
        <p className="signup-link">
          Don’t have an account? <a href="/register">Create account</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
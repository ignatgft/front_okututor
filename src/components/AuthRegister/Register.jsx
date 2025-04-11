import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/AuthRegister/Register.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import mankeyIcon from "../../assets/AuthRegister/mankey-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg"; // Импортируем иконку глаза
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg"; // Опционально: иконка для "пароль виден"

const Register = ({ isOpen, onClose, onOpenAuth }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.repeatPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Register data:", formData);
    // Здесь можно добавить логику для отправки данных на сервер
  };

  const handleGoogleSignUp = () => {
    console.log("Google sign-up clicked");
    // Здесь можно добавить логику для регистрации через Google
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

        {/* Кнопка Google */}
        <button className="google-btn" onClick={handleGoogleSignUp}>
          <img src={googleIcon} alt="Google Icon" className="google-icon" />
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Форма */}
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
              >
                <img src={showPassword ? hidePasswordIcon : showPasswordIcon} alt="Toggle Password Visibility" />
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
              >
                <img src={showRepeatPassword ? hidePasswordIcon : showPasswordIcon} alt="Toggle Password Visibility" />
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Sign up
          </button>
        </form>

        {/* Ссылка на авторизацию */}
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
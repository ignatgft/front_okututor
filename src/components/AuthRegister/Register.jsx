import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom"; // Добавлен useNavigate
import "../../styles/AuthRegister/Register.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg"; // Предполагается, что у вас есть иконка Google
import mankeyIcon from "../../assets/AuthRegister/mankey-icon.svg";


const Register = () => {  
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

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
    <div className="register-container">
      <div className="register-form">
        <h2>Sign up now <span role="img" aria-label="key">🔑</span></h2>

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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="repeatPassword">Repeat password</label>
            <input
              type="password"
              id="repeatPassword"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Sign up
          </button>
        </form>

        {/* Ссылка на авторизацию */}
        <p className="login-link">
          Already have an account? <a href="/auth">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
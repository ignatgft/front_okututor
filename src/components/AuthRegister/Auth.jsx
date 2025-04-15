import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/AuthRegister/Auth.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import handIcon from "../../assets/AuthRegister/hand-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg";
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const Auth = ({ isOpen, onClose, onOpenRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    try {
      // Проверяем пользователя на сервере через ваш API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      // Если сервер подтвердил, что пользователь существует, выполняем вход в Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      setSuccess("Login successful!");
      console.log("Logged in user:", user);

      setTimeout(() => {
        onClose();
        setFormData({
          email: "",
          password: "",
          rememberMe: false,
        });
      }, 2000);
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (error.code === "auth/user-not-found") {
        setError("User not found");
      } else {
        setError(error.message);
      }
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
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

        <button className="google-btn" onClick={handleGoogleLogin}>
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
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="submit-btn">
            Log in
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
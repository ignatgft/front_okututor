import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/AuthRegister/Auth.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import handIcon from "../../assets/AuthRegister/hand-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg";
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";

const Auth = ({ isOpen, onClose, onOpenRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Добавляем состояние загрузки

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
      // Устанавливаем тип сессии в зависимости от rememberMe
      await setPersistence(
        auth,
        formData.rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

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
        setLoading(false);
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
        setLoading(false);
      }, 2000);
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
      // Устанавливаем тип сессии в зависимости от rememberMe
      await setPersistence(
        auth,
        formData.rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Получаем свежий ID-токен
      const idToken = await user.getIdToken(true);

      // Отправляем ID-токен на сервер
      const response = await fetch(`${import.meta.env.VITE_API_URL}/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: idToken }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        await auth.signOut();
        setLoading(false);
        return;
      }

      setSuccess("Google login successful!");
      console.log("Google login user:", user);

      setTimeout(() => {
        onClose();
        setFormData({
          email: "",
          password: "",
          rememberMe: false,
        });
        setLoading(false);
      }, 2000);
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

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

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
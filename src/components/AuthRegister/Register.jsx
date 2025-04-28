import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/AuthRegister/Register.css";
import googleIcon from "../../assets/AuthRegister/google-icon.svg";
import mankeyIcon from "../../assets/AuthRegister/mankey-icon.svg";
import showPasswordIcon from "../../assets/AuthRegister/show-password-icon.svg";
import hidePasswordIcon from "../../assets/AuthRegister/hide-password-icon.svg";
import { auth } from "../../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
      // Регистрация пользователя в Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Обновляем displayName пользователя в Firebase
      await updateProfile(user, {
        displayName: formData.fullName,
      });

      // Отправляем данные на ваш сервер (без повторного создания пользователя)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          repeat_password: formData.repeatPassword, // Добавляем repeat_password
          full_name: formData.fullName,
          user_id: user.uid, // Передаём user_id для сохранения в Firestore
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        await user.delete(); // Удаляем пользователя из Firebase, если сервер вернул ошибку
        return;
      }

      setSuccess("Registration successful! You are now logged in.");
      console.log("Registered user:", user);

      setTimeout(() => {
        onClose();
        setFormData({
          fullName: "",
          email: "",
          password: "",
          repeatPassword: "",
        });
      }, 2000);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Email already exists");
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters");
      } else {
        setError(error.message);
      }
    }
  };

  // Register.jsx
const handleGoogleSignUp = async () => {
  setError("");
  setSuccess("");
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Получаем свежий ID-токен
    const idToken = await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    console.log("Token expiration:", tokenResult.expirationTime); // Логируем время истечения

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
      return;
    }

    setSuccess("Google sign-up successful! You are now logged in.");
    console.log("Google sign-up user:", user);

    setTimeout(() => {
      onClose();
    }, 2000);
  } catch (error) {
    setError(error.message);
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
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

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
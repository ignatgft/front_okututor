import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/Navbar/logo.svg";
import login from "../assets/Navbar/login.svg";
import Auth from "./AuthRegister/Auth"; // Импортируем компонент авторизации
import Register from "./AuthRegister/Register"; // Импортируем компонент регистрации

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false); // Состояние для модального окна авторизации
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // Состояние для модального окна регистрации

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Функции для открытия модальных окон
  const handleLogin = () => {
    setIsAuthOpen(true);
    setIsOpen(false); // Закрываем бургер-меню, если оно открыто
  };

  const handleSignup = () => {
    setIsRegisterOpen(true);
    setIsOpen(false); // Закрываем бургер-меню, если оно открыто
  };

  // Функции для переключения между модальными окнами
  const openRegisterFromAuth = () => {
    setIsAuthOpen(false); // Закрываем модальное окно авторизации
    setIsRegisterOpen(true); // Открываем модальное окно регистрации
  };

  const openAuthFromRegister = () => {
    setIsRegisterOpen(false); // Закрываем модальное окно регистрации
    setIsAuthOpen(true); // Открываем модальное окно авторизации
  };

  return (
    <nav className="navbar inter">
      {/* Логотип */}
      <div className="navbar-logo">
        <div className="logo-text">
          <img src={logo} className="logo-svg" alt="Logo" />
          <h1>OKUTUTOR</h1>
        </div>
        {/* Бургер-меню для мобильной версии */}
        <div className={`navbar-toggle ${isOpen ? "active" : ""}`} onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      {/* Навигационные ссылки и кнопки внутри одного контейнера для мобильной версии */}
      <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
        <ul className="navbar-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/">Find Tutor</Link>
          </li>
          <li>
            <Link to="/">For Tutors</Link>
          </li>
          <li>
            <Link to="/">About us</Link>
          </li>
        </ul>

        {/* Кнопки Log in и Sign up */}
        <div className="navbar-buttons">
          <button className="btn login-btn" onClick={handleLogin}>
            <img src={login} className="login-svg" alt="Login Icon" />
            Log in
          </button>
          <button className="btn signup-btn" onClick={handleSignup}>
            Sign up
          </button>
        </div>
      </div>

      {/* Модальные окна для авторизации и регистрации */}
      <Auth
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenRegister={openRegisterFromAuth} // Передаем функцию для открытия регистрации
      />
      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenAuth={openAuthFromRegister} // Передаем функцию для открытия авторизации
      />
    </nav>
  );
};

export default Navbar;
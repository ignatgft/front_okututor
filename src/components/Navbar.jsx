import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom"; // Добавлен useNavigate
import '../styles/Navbar.css';
import logo from '../assets/Navbar/logo.svg'
import login from '../assets/Navbar/login.svg'


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Функции для перехода на страницы
  const handleLogin = () => {
    navigate('/auth');
  };
  
  const handleSignup = () => {
    navigate('/register');
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
        <div className={`navbar-toggle ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      {/* Навигационные ссылки и кнопки внутри одного контейнера для мобильной версии */}
      <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
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
            <img src={login} className="login-svg" alt="Logo" />
            Log in
          </button>
          <button className="btn signup-btn" onClick={handleSignup}>Sign up</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
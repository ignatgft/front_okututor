import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Добавляем useNavigate
import "../styles/Navbar.css";
import logo from "../assets/Navbar/logo.svg";
import login from "../assets/Navbar/login.svg";
import Auth from "./AuthRegister/Auth";
import Register from "./AuthRegister/Register";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Для перехода на страницу профиля

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {
    setIsAuthOpen(true);
    setIsOpen(false);
  };

  const handleSignup = () => {
    setIsRegisterOpen(true);
    setIsOpen(false);
  };

  const openRegisterFromAuth = () => {
    setIsAuthOpen(false);
    setIsRegisterOpen(true);
  };

  const openAuthFromRegister = () => {
    setIsRegisterOpen(false);
    setIsAuthOpen(true);
  };

  // Переход на страницу профиля при клике на аватар
  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <nav className="navbar inter">
      <div className="navbar-logo">
        <div className="logo-text">
          <img src={logo} className="logo-svg" alt="Logo" />
          <h1>OKUTUTOR</h1>
        </div>
        <div className={`navbar-toggle ${isOpen ? "active" : ""}`} onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

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

        <div className="navbar-buttons">
          {user ? (
            <div className="user-profile">
              <img
                src={user.photoURL || "https://via.placeholder.com/40"}
                alt="User Avatar"
                className="user-avatar"
                onClick={handleProfileClick} // Переход на страницу профиля
                style={{ cursor: "pointer" }} // Указываем, что аватар кликабельный
              />
            </div>
          ) : (
            <>
              <button className="btn login-btn" onClick={handleLogin}>
                <img src={login} className="login-svg" alt="Login Icon" />
                Log in
              </button>
              <button className="btn signup-btn" onClick={handleSignup}>
                Sign up
              </button>
            </>
          )}
        </div>
      </div>

      <Auth
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenRegister={openRegisterFromAuth}
      />
      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenAuth={openAuthFromRegister}
      />
    </nav>
  );
};

export default Navbar;
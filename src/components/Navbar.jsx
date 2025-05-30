import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link as ScrollLink, scroller } from "react-scroll";
import { useTranslation } from "react-i18next";
import "../styles/Navbar.css";
import logo from "../assets/Navbar/logo.svg";
import login from "../assets/Navbar/login.svg";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { FaVideo } from "react-icons/fa";

const Navbar = ({ onLogin, onSignup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false); // Для выпадающего меню языков
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleLanguageDropdown = () => setLanguageOpen((prev) => !prev);

  const handleScrollLink = (section) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { target: section } });
    } else {
      scroller.scrollTo(section, { duration: 500, smooth: true });
    }
  };

  const handleFindTutorClick = () => {
    if (auth.currentUser) {
      navigate("/find-tutors");
    } else {
      if (onLogin) onLogin();
    }
  };

  const handleProfileClick = () => navigate("/profile");
  const handleAuditoriumClick = () => navigate("/auditorium");

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageOpen(false); // Закрываем выпадающее меню после выбора языка
  };

  return (
    <nav className="navbar inter">
      <div className="navbar-logo">
        <div className="logo-text">
          <img src={logo} className="logo-svg" alt="Logo" />
          <h1>OKUTUTOR</h1>
        </div>
        <div
          className={`navbar-toggle ${isOpen ? "active" : ""}`}
          onClick={toggleMenu}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
        <ul className="navbar-links">
          <li onClick={() => handleScrollLink("hero")}>{t("navbar.home")}</li>
          <li onClick={() => handleScrollLink("category")}>{t("navbar.category")}</li>
          <li onClick={handleFindTutorClick}>{t("navbar.find_tutor")}</li>
          <li onClick={() => handleScrollLink("for-tutors")}>{t("navbar.for_tutors")}</li>
          <li onClick={() => handleScrollLink("about-us")}>{t("navbar.about_us")}</li>
        </ul>

        <div className="navbar-buttons">
          <div className="language-selector" onClick={toggleLanguageDropdown}>
            <span className="language-current">{i18n.language.toUpperCase()}</span>
            {languageOpen && (
              <div className="language-dropdown">
                {["en", "ru", "kg"].map((langCode) => (
                  <button
                    key={langCode}
                    className={`lang-btn ${i18n.language === langCode ? "active" : ""}`}
                    onClick={() => handleLanguageChange(langCode)}
                  >
                    {langCode.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <button className="auditorium-btn-animated" onClick={handleAuditoriumClick}>
                <FaVideo style={{ marginRight: "8px" }} />
                {t("navbar.auditorium")}
              </button>

              <div
                className="user-profile"
                onClick={handleProfileClick}
                role="button"
                tabIndex={0}
              >
                <img
                  src={user.photoURL || "https://via.placeholder.com/40"}
                  alt="User Avatar"
                  className="user-avatar"
                />
              </div>
            </>
          ) : (
            <>
              <button className="btn login-btn" onClick={onLogin}>
                <img src={login} className="login-svg" alt="Login Icon" />
                {t("navbar.login")}
              </button>
              <button className="btn signup-btn" onClick={onSignup}>
                {t("navbar.signup")}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
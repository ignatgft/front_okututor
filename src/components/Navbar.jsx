import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleScrollLink = (section) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { target: section } });
    } else {
      scroller.scrollTo(section, { duration: 500, smooth: true });
    }
  };

  const handleProfileClick = () => navigate("/profile");
  const handleAuditoriumClick = () => navigate("/auditorium");

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar inter">
      <div className="navbar-logo">
        <div className="logo-text">
          <img src={logo} className="logo-svg" alt="Logo" />
          <h1>OKUTUTOR</h1>
        </div>
        <div className={`navbar-toggle ${isOpen ? "active" : ""}`} onClick={toggleMenu}>
          <span className="bar"></span><span className="bar"></span><span className="bar"></span>
        </div>
      </div>

      <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
        <ul className="navbar-links">
          <li onClick={() => handleScrollLink("hero")}>{t("navbar.home")}</li>
          <li onClick={() => handleScrollLink("category")}>{t("navbar.category")}</li>
          <li onClick={() => handleScrollLink("findTutor")}>{t("navbar.find_tutor")}</li>
          <li onClick={() => handleScrollLink("for-tutors")}>{t("navbar.for_tutors")}</li>
          <li onClick={() => handleScrollLink("about-us")}>{t("navbar.about_us")}</li>
        </ul>

        <div className="navbar-buttons">
          {user ? (
            <>
              <button className="auditorium-btn-animated" onClick={handleAuditoriumClick}>
                <FaVideo style={{ marginRight: "8px" }} />
                {t("navbar.auditorium")}
              </button>

              <div className="user-profile" onClick={toggleDropdown}>
                <img
                  src={user.photoURL || "https://via.placeholder.com/40"}
                  alt="User Avatar"
                  className="user-avatar"
                />
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <button className="profile-btn" onClick={handleProfileClick}>
                      {t("navbar.profile")}
                    </button>
                    <div className="language-options">
                      <span>{t("navbar.language")}:</span>
                      <button
                        className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
                        onClick={() => handleLanguageChange("en")}
                      >
                        EN
                      </button>
                      <button
                        className={`lang-btn ${i18n.language === "ru" ? "active" : ""}`}
                        onClick={() => handleLanguageChange("ru")}
                      >
                        RU
                      </button>
                      <button
                        className={`lang-btn ${i18n.language === "kg" ? "active" : ""}`}
                        onClick={() => handleLanguageChange("kg")}
                      >
                        KG
                      </button>
                    </div>
                  </div>
                )}
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

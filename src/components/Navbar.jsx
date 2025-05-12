import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // ✅ добавлен Link
import { Link as ScrollLink, scroller } from "react-scroll";
import "../styles/Navbar.css";
import logo from "../assets/Navbar/logo.svg";
import login from "../assets/Navbar/login.svg";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const Navbar = ({ onLogin, onSignup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    setIsOpen(false);
    if (onLogin) onLogin();
  };

  const handleSignup = () => {
    setIsOpen(false);
    if (onSignup) onSignup();
  };

  const handleScrollLink = (section) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { target: section } });
    } else {
      scroller.scrollTo(section, {
        duration: 500,
        smooth: true,
      });
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleAuditoriumClick = () => {
    setIsOpen(false);
    navigate("/auditorium");
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
          <li onClick={() => handleScrollLink("hero")}>Home</li>
          <li onClick={() => handleScrollLink("category")}>Category</li>
          <li onClick={() => handleScrollLink("find-tutor")}>Find Tutor</li>
          <li onClick={() => handleScrollLink("for-tutors")}>For Tutors</li>
          <li onClick={() => handleScrollLink("about-us")}>About Us</li>
        </ul>

        <div className="navbar-buttons">
          {user ? (
            <>
              <Link to="/auditorium">
                <button className="signup-btn">Аудитория</button>
              </Link>
              <div className="user-profile" onClick={handleProfileClick}>
                <img
                  src={user.photoURL || "https://via.placeholder.com/40"}
                  alt="User Avatar"
                  className="user-avatar"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </>
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
    </nav>
  );
};

export default Navbar;

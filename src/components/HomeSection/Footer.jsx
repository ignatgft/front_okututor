import React from "react";
import { useTranslation } from "react-i18next";
import "../../styles/HomeSectionCSS/Footer.css";
import instagram from "../../assets/Footer/instagram.svg";
import linkedIn from "../../assets/Footer/linkedIn.svg";
import telegram from "../../assets/Footer/telegram.svg";
import logo from "../../assets/Footer/white-logo.svg";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Логотип и заголовок */}
        <div className="footer-logo">
          <img src={logo} alt="Okututor Logo" className="logo-image" />
          <div className="footer-logo-text poppins-medium">
            <p>{t("footer.learning_and_teaching")}</p>
          </div>
        </div>

        {/* Текст подписки */}
        <p className="newsletter-text poppins-medium">
          {t("footer.subscribe")}
        </p>

        {/* Социальные иконки */}
        <div className="social-icons">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <div className="social-icon">
              <img src={linkedIn} alt="LinkedIn" />
            </div>
          </a>
          <a href="https://telegram.com" target="_blank" rel="noopener noreferrer">
            <div className="social-icon">
              <img src={telegram} alt="telegram" />
            </div>
          </a>
          <a
            href="https://www.instagram.com/okututor/?igsh=MTVsOTR6Mm44M3RpbA%3D%3D#"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="social-icon">
              <img src={instagram} alt="instagram" />
            </div>
          </a>
        </div>

        {/* Копирайт */}
        <p className="copyright poppins-regular">
          © 2025 Okututor Inc.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

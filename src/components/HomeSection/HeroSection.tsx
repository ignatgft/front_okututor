// migrated to TSX — minimal strict types (controlled)
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import "../../styles/HomeSectionCSS/HeroSection.css";
import heroSection from "../../assets/Navbar/heroSection.webp";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { openAuth } = useUIStore();

  const handleSubmitStart = () => {
    if (isAuthenticated) {
      navigate("/find-tutors");
    } else {
      openAuth();
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">{t("hero.title")}</h1>
          <p className="hero-subtitle">{t("hero.subtitle")}</p>

          <div className="hero-buttons">
            <button className="hero-btn-primary" onClick={handleSubmitStart}>
              {t("hero.start_btn")}
            </button>
            <button className="hero-btn-secondary" onClick={() => navigate("/find-tutors")}>
              {t("hero.find_text")}
            </button>
          </div>
        </div>

        <div className="hero-image-container">
          <img src={heroSection} alt={t("hero.image_alt", "Student with books")} className="hero-image" fetchpriority="high" decoding="async" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

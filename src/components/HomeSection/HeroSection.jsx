import React from 'react';
import {useNavigate} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/HomeSectionCSS/HeroSection.css';
import heroSection from '../../assets/Navbar/heroSection.svg';

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSubmitStart = () => navigate("/find-tutors")
  return (
    <section className="hero-section">
      <div className="hero-content poppins-bold">
        {/* Текстовая часть */}
        <h1 className="hero-title">
          {t("hero.title")}
        </h1>
        <p className="hero-subtitle poppins-regular">
          {t("hero.subtitle")}
        </p>

        {/* Блок с текстом и кнопкой */}
        <div className="hero-buttons inter">
          <div className="find-tutor-text">{t("hero.find_text")}</div>
          <button className="btn start-btn" onClick={handleSubmitStart}>
            {t("hero.start_btn")}
          </button>
        </div>
      </div>

      {/* Изображение с иконками */}
      <div className="hero-image-container">
        <img src={heroSection} alt="Student with books" className="hero-image" />
      </div>
      
      {/* Волнистый фон внизу с помощью SVG */}
      <svg className="wave" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          fill="#f9f9f9"
          d="M0,0 Q720,200 1440,0 L1440,100 L0,100 Z"
        />
      </svg>
    </section>
  );
};

export default HeroSection;

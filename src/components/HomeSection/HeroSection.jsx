import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomeSectionCSS/HeroSection.css';
import heroSection from '../../assets/Navbar/heroSection.svg'


const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content poppins-bold">
        {/* Текстовая часть */}
        <h1 className="hero-title">
          Studying Online is <br/>now much easier.
        </h1>
        <p className="hero-subtitle poppins-regular">
          Okututor is an interesting platform that will <br /> teach you in more interactive way
        </p>

        {/* Блок с текстом и кнопкой */}
        <div className="hero-buttons inter">
          <div className="find-tutor-text">Find your tutor</div>
          <Link to="/start" className="btn start-btn">
            Start
          </Link>
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
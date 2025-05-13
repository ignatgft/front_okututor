import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../../styles/HomeSectionCSS/PopTutor.css';

const PopTutor = () => {
  const { t } = useTranslation();
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(!isClicked);
  };

  return (
    <section className="category-section inter">
      <div className="category-header">
        <span className="category-subtitle">{t("pop.subtitle")}</span>
        <h2 className="category-title">{t("pop.title")}</h2>
      </div>
      <div className="category-grid">
        {/* Здесь можно отрисовать популярных репетиторов */}
      </div>
      <button
        className={`show-more-button ${isClicked ? 'clicked' : ''}`}
        onClick={handleClick}
      >
        {t("pop.show_more")}
      </button>
    </section>
  );
};

export default PopTutor;

// frontend/src/components/HomeSection/Category.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/HomeSectionCSS/Category.css';

import ortIcon from '../../assets/CategorySection/ort-icon.svg';
import englishIcon from '../../assets/CategorySection/english-icon.svg';
import mathIcon from '../../assets/CategorySection/math-icon.svg';
import itIcon from '../../assets/CategorySection/it-icon.svg';
import russianIcon from '../../assets/CategorySection/russian-icon.svg';
import salesIcon from '../../assets/CategorySection/sales-icon.svg';
import designIcon from '../../assets/CategorySection/design-icon.svg';
import musicIcon from '../../assets/CategorySection/music-icon.svg';

const Category = () => {
  const { t } = useTranslation();

  const categories = [
    {
      title: t('categories.ort.title'),
      description: t('categories.ort.description'),
      icon: ortIcon,
    },
    {
      title: t('categories.english.title'),
      description: t('categories.english.description'),
      icon: englishIcon,
    },
    {
      title: t('categories.math.title'),
      description: t('categories.math.description'),
      icon: mathIcon,
    },
    {
      title: t('categories.it.title'),
      description: t('categories.it.description'),
      icon: itIcon,
    },
    {
      title: t('categories.russian.title'),
      description: t('categories.russian.description'),
      icon: russianIcon,
    },
    {
      title: t('categories.sales.title'),
      description: t('categories.sales.description'),
      icon: salesIcon,
    },
    {
      title: t('categories.design.title'),
      description: t('categories.design.description'),
      icon: designIcon,
    },
    {
      title: t('categories.music.title'),
      description: t('categories.music.description'),
      icon: musicIcon,
    },
  ];

  return (
    <section className="category-section inter" id="category">
      <div className="category-header">
        <span className="category-subtitle">{t('categories.subtitle')}</span>
        <h2 className="category-title">{t('categories.title')}</h2>
      </div>
      <div className="category-grid">
        {categories.map((category, index) => (
          <Link
            to={`/find-tutors?q=${encodeURIComponent(category.title)}`}
            key={index}
            className="category-card"
          >
            <div className="category-icon">
              <img src={category.icon} alt={`${category.title} icon`} />
            </div>
            <h3 className="category-card-title">{category.title}</h3>
            <p className="category-card-description">{category.description}</p>
            <span className="category-card-link">{t('categories.show_more')}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Category;

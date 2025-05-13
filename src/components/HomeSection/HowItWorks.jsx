import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/HomeSectionCSS/HowItWorks.css';

import step1Image from '../../assets/HowItWorkSection/step1-image.svg';
import step2Image from '../../assets/HowItWorkSection/step2-image.svg';
import step3Image from '../../assets/HowItWorkSection/step3-image.svg';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      title: t('how.steps.step1.title'),
      description: t('how.steps.step1.description'),
      image: step1Image,
    },
    {
      number: 2,
      title: t('how.steps.step2.title'),
      description: t('how.steps.step2.description'),
      image: step2Image,
    },
    {
      number: 3,
      title: t('how.steps.step3.title'),
      description: t('how.steps.step3.description'),
      image: step3Image,
    },
  ];

  return (
    <section className="how-it-works-section inter">
      <div className="category-header">
        <span className="category-subtitle">{t('how.subtitle')}</span>
        <h2 className="category-title">{t('how.title')}</h2>
      </div>
      <div className="how-it-works-grid">
        {steps.map((step) => (
          <div key={step.number} className="how-it-works-card">
            <div className="step-number">{step.number}</div>
            <div className="step-image">
              <img src={step.image} alt={`Step ${step.number}`} />
            </div>
            <div className="cart-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;

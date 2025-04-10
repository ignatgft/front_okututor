import React from 'react';
import '../../styles/HomeSectionCSS/HowItWorks.css';

// Импортируем изображения (замените на свои пути)
import step1Image from '../../assets/HowItWorkSection/step1-image.svg';
import step2Image from '../../assets/HowItWorkSection/step2-image.svg';
import step3Image from '../../assets/HowItWorkSection/step3-image.svg';

const steps = [
  {
    number: 1,
    title: 'Create an Account',
    description: "Go to the website's homepage and click on the 'Sign up' or 'Log in' button.",
    image: step1Image,
  },
  {
    number: 2,
    title: 'Search Desired Tutor',
    description: 'Start browsing through tutor ads carefully and choose by filters.',
    image: step2Image,
  },
  {
    number: 3,
    title: 'Start Learning Fast',
    description: 'Set your weekly course plan and get ready to achieve your goals!',
    image: step3Image,
  },
];

const HowItWorks = () => {
  return (
    <section className="how-it-works-section inter">
      <div className="category-header">
        <span className="category-subtitle">How it works</span>
        <h2 className="category-title">Finding Your Success by Tutors. A Step-by-Step Process</h2>
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
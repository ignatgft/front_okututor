import React from 'react';
import '../../styles/HomeSectionCSS/ForTutors.css';
import tutorImage from '../../assets/ForTutors/tutor-img.svg';

const steps = [
  {
    number: 1,
    title: 'Sign up',
    description: 'to create your tutor resume',
  },
  {
    number: 2,
    title: 'Create your Course',
    description: 'to start teaching & earning',
  },
  {
    number: 3,
    title: 'Start earning',
    description: 'by teaching and developing your successful careers',
  },
];

const ForTutors = () => {
  return (
    <section className="for-tutors-section inter">
      <div className="category-header">
        <span className="category-subtitle">How to become a Tutor</span>
        <h2 className="category-title">
          Empower learners worldwide and build your career teaching.
        </h2>
      </div>
      <div className="for-tutors-content">
        <div className="left-content">
          <div className="steps-container">
            {steps.map((step) => (
              <div key={step.number} className="step-item">
                <div className="step-number">{step.number}</div>
                <div className="step-text">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="button-wrapper">
            <button className="create-course-btn">Create your Course</button>
          </div>
        </div>
        <div className="tutor-image">
          <img src={tutorImage} alt="Tutor" />
        </div>
      </div>
    </section>
  );
};

export default ForTutors;
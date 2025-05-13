import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebaseConfig";
import "../../styles/HomeSectionCSS/ForTutors.css";
import tutorImage from "../../assets/ForTutors/tutor-img.svg";

const ForTutors = ({ onLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: t("tutors.step1.title"),
      description: t("tutors.step1.description"),
    },
    {
      number: 2,
      title: t("tutors.step2.title"),
      description: t("tutors.step2.description"),
    },
    {
      number: 3,
      title: t("tutors.step3.title"),
      description: t("tutors.step3.description"),
    },
  ];

  const handleCreateCourseClick = () => {
    if (auth.currentUser) {
      navigate("/course");
    } else {
      if (onLogin) onLogin();
    }
  };

  return (
    <section className="for-tutors-section inter">
      <div className="category-header">
        <span className="category-subtitle">{t("tutors.subtitle")}</span>
        <h2 className="category-title">{t("tutors.title")}</h2>
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
            <button
              className="create-course-btn"
              onClick={handleCreateCourseClick}
            >
              {t("tutors.create_button")}
            </button>
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

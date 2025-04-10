import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomeSectionCSS/PopTutor.css';

const PopTutor = () => {
    
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
      setIsClicked(!isClicked);
  };

  return (
    <section className="category-section inter">
      <div className="category-header">
        <span className="category-subtitle">Tutor is here</span>
        <h2 className="category-title">Most popular Tutors in our platform</h2>
      </div>
      <div className="category-grid">
      </div>
      <button
        className={`show-more-button ${isClicked ? 'clicked' : ''}`}
        onClick={handleClick}>
          Show more
      </button>
    </section>
  );
};

export default PopTutor;
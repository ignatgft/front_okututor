import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CardCourse.css';

const CardCourse = ({ course, userData }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <div className="card-course inter" onClick={handleCardClick}>
      <div className="card-header">
        <img
          src={userData?.photoURL || "https://via.placeholder.com/40"}
          alt="Tutor"
          className="avatar"
        />
        <div className="course-info">
          <h3>{course.title || "English Language"}</h3>
          <p className="instructor">{userData?.full_name || "Subankulov Adil"}</p>
        </div>
      </div>

      <div className="card-body">
        <p>
          {course.description
            ? `${course.description.slice(0, 100)}${course.description.length > 100 ? '...' : ''}`
            : "Hi there! 👋 Are you ready to improve your English skills? Whether you're a beginner or looking to polish your advan..."}
        </p>
      </div>

      <div className="card-buttons">
        <span className="tag">{course.location_type || "Online"}</span>
        <span className="tag">{course.days || "Weekdays"}</span>
        <span className="tag">{course.group_size === "individual" ? "Private" : "Group"}</span>
        {course.group_size === "individual" && <span className="tag">Private</span>}
      </div>
      <hr className="card-divider" />
      <div className="card-footer">
        <span className="location">{userData?.location || "Bishkek, Kyrgyzstan"}</span>
        <span className="pricee">{course.price_per_hour ? `${course.price_per_hour}som/hour` : "7$/hour"}</span>
      </div>
    </div>
  );
};

export default CardCourse;

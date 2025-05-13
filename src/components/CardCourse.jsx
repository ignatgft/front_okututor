import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CardCourse.css";

const CardCourse = ({ course }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!course.user_id) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/user/${course.user_id}`);
        if (!response.ok) throw new Error("User fetch failed");
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    fetchUserData();
  }, [course.user_id]);

  return (
    <div className="card-course" onClick={handleCardClick}>
      <div className="card-header">
        <img
          src={userData?.avatar || "https://via.placeholder.com/40"}
          alt="Tutor Avatar"
          className="course-avatar"
        />
        <div className="course-title-block">
          <h3 className="course-title">{course.title || "Course Title"}</h3>
          <p className="course-instructor">{userData?.full_name || "Instructor Name"}</p>
        </div>
      </div>

      <div className="card-description">
        <p>
          {course.description
            ? `${course.description.slice(0, 100)}${course.description.length > 100 ? "..." : ""}`
            : "No course description available."}
        </p>
      </div>

      <div className="card-tags">
        <span className="tag">{course.location_type || "ONLINE"}</span>
        <span className="tag">{course.days || "WEEKDAYS"}</span>
        <span className="tag">{course.group_size === "individual" ? "PRIVATE" : "GROUP"}</span>
      </div>

      <div className="card-footer">
        <span className="card-location">{userData?.location || "Location"}</span>
        <span className="card-price">
          {course.price_per_hour ? `${course.price_per_hour} som/hour` : "Price not set"}
        </span>
      </div>
    </div>
  );
};

export default CardCourse;

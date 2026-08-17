import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api/endpoints";
import { apiFetch } from "../api/http";
import "../styles/CardCourse.css";

const CardCourse = ({ course, userData: initialUserData }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(initialUserData || null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialUserData = initialUserData && Object.keys(initialUserData).length > 0;

  useEffect(() => {
    setUserData(initialUserData || null);
  }, [initialUserData, course.teacher_id]);

  useEffect(() => {
    if (!course.teacher_id) {
      setIsLoading(false);
      return;
    }

    if (hasInitialUserData) {
      setAvatarUrl(initialUserData?.avatar || initialUserData?.photoURL || getDefaultAvatar(initialUserData?.full_name));
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { response, data } = await apiFetch(endpoints.userById(course.teacher_id));
        if (!response.ok) throw new Error("User fetch failed");
        setUserData(data);
        // Устанавливаем начальный URL аватарки
        setAvatarUrl(data?.avatar || data?.photoURL || getDefaultAvatar(data?.full_name));
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserData({ full_name: "Unknown Instructor", location: "Unknown" });
        setAvatarUrl(getDefaultAvatar("Unknown Instructor"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [course.teacher_id, hasInitialUserData, initialUserData]);

  // Функция для генерации заглушки на основе имени
  const getDefaultAvatar = (name) => {
    if (!name) return "https://via.placeholder.com/150";
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=0D8ABC&color=fff&size=150`;
  };

  // Обработчик ошибки загрузки изображения
  const handleImageError = () => {
    setAvatarUrl(getDefaultAvatar(userData?.full_name || "Unknown Instructor"));
  };

  const handleCardClick = () => {
    navigate(`/course/${course.id}`);
  };

  if (isLoading) {
    return (
      <div className="card-course card-skeleton">
        <div className="skeleton skeleton-header" />
        <div className="skeleton skeleton-line wide" />
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton-tags">
          <span className="skeleton skeleton-chip" />
          <span className="skeleton skeleton-chip" />
          <span className="skeleton skeleton-chip" />
        </div>
        <div className="skeleton-footer">
          <span className="skeleton skeleton-line short" />
          <span className="skeleton skeleton-line short" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-course dark-card dark-card-hover" onClick={handleCardClick}>
      <div className="card-header">
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="course-avatarr"
          onError={handleImageError} // Обработчик ошибки загрузки
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

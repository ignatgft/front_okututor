// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, StarHalf } from "lucide-react";
import "../styles/CardCourse.css";

const getDefaultAvatar = (name) => {
  if (!name) return "https://via.placeholder.com/150";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=150`;
};

const CardCourse = ({ course }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const teacherName = course.teacher_name || course.teacherName || "";
  const teacherAvatar = course.teacher_avatar || course.teacherAvatar || "";
  const price = course.price_per_hour || course.price || null;

  const [avatarUrl, setAvatarUrl] = useState(
    teacherAvatar || getDefaultAvatar(teacherName)
  );

  const handleCardClick = () => navigate(`/course/${course.id}`);

  const handleImageError = () => {
    setAvatarUrl(getDefaultAvatar(teacherName || "Instructor"));
  };

  const renderSmallStars = (rating) => {
    if (!rating) return null;
    const r = Number(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(r)) {
        stars.push(<Star key={i} size={12} color="#ffd700" fill="#ffd700" aria-hidden="true" />);
      } else if (i - 0.5 <= r) {
        stars.push(<StarHalf key={i} size={12} color="#ffd700" fill="#ffd700" aria-hidden="true" />);
      } else {
        stars.push(<Star key={i} size={12} color="#ffd700" aria-hidden="true" />);
      }
    }
    return <div className="card-star-rating" aria-hidden="true">{stars}</div>;
  };

  return (
    <div
      className="card-course"
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(); } }}
      role="link"
      tabIndex={0}
    >
      <div className="card-header">
        <img
          src={avatarUrl}
          alt={teacherName}
          className="course-avatar"
          onError={handleImageError}
          loading="lazy"
        />
        <div className="course-title-block">
          <h3 className="course-title">{course.title || t("course.title_placeholder", "Course")}</h3>
          <Link
            to={`/tutor/${course.teacher_id}`}
            className="course-instructor"
            onClick={(e) => e.stopPropagation()}
          >
            {teacherName || t("course.instructor_placeholder", "Instructor")}
          </Link>
        </div>
      </div>

      <div className="card-description">
        <p>
          {course.description
            ? `${course.description.slice(0, 100)}${course.description.length > 100 ? "..." : ""}`
            : t("course.no_description", "No description")}
        </p>
      </div>

      <div className="card-tags">
        {course.location_type && (
          <span className="tag">{t(`course.location_type.${course.location_type}`, course.location_type)}</span>
        )}
        {Array.isArray(course.days) && course.days.length > 0 && (
          <span className="tag">{course.days.map((d) => t(`course.day.${d}`, d)).join(", ")}</span>
        )}
        {typeof course.days === "string" && (
          <span className="tag">{course.days}</span>
        )}
        {course.group_size && (
          <span className="tag">{t(`course.group_type.${course.group_size}`, course.group_size)}</span>
        )}
        {course.subject && (
          <span className="tag tag-subject">{t(`course.subject.${course.subject}`, course.subject)}</span>
        )}
      </div>

      <div className="card-footer">
        <span className="card-rating">
          {renderSmallStars(course.average_rating || course.rating)}
          {(course.average_rating || course.rating)
            ? <span className="rating-value">{Number(course.average_rating || course.rating).toFixed(1)}</span>
            : null}
        </span>
        <span className="card-price">
          {price != null
            ? `${price} ${t("course.som_per_hour")}`
            : t("common.price_not_set", "Price not set")}
        </span>
      </div>
    </div>
  );
};

export default CardCourse;

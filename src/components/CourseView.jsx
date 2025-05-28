import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { useTranslation } from "react-i18next";
import { AiFillStar, AiOutlineStar } from "react-icons/ai"; // Импорт из набора ai
import { FaStarHalfAlt } from "react-icons/fa"; // Импорт половинной звезды из набора fa
import "../styles/CourseView.css";

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [userData, setUserData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null); // Состояние для URL аватарки
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        const courseRes = await fetch(`${import.meta.env.VITE_API_URL}/courses`);
        const allCourses = await courseRes.json();
        const selected = allCourses.find((c) => c.id === courseId);
        setCourse(selected);

        if (selected) {
          const userRes = await fetch(`${import.meta.env.VITE_API_URL}/user/${selected.teacher_id}`);
          const user = await userRes.json();
          setUserData(user);
          // Устанавливаем URL аватарки
          setAvatarUrl(user?.avatar || user?.photoURL || getDefaultAvatar(user?.full_name));
        }

        const reviewRes = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`);
        const reviewData = await reviewRes.json();
        setReviews(reviewData);

        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === selected?.teacher_id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error loading course:", error);
        setError(t("course.fetch_error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, t]);

  const handleDelete = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: "DELETE",
      });
      navigate("/");
    } catch (err) {
      console.error("Error deleting course", err);
      setError(t("course.delete_error"));
    }
  };

  const handleEdit = () => navigate(`/course/edit/${courseId}`);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStarClick = (value) => {
    setReviewForm((prev) => {
      const newRating = prev.rating === value ? 0 : value;
      return { ...prev, rating: newRating };
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const currentUser = auth.currentUser;
    if (!currentUser) return setError(t("course.login_first"));
    if (currentUser.uid === course.teacher_id) return setError(t("course.cannot_review_own"));

    if (reviewForm.rating === 0) return setError(t("course.rating_required"));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: currentUser.uid,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccess(t("course.review_submitted"));
        setReviewForm({ rating: 0, comment: "" });
        setReviews((prev) => [...prev, { ...result, rating: reviewForm.rating, comment: reviewForm.comment }]);
      } else {
        setError(result.error || t("course.review_submit_fail"));
      }
    } catch (err) {
      setError(t("course.network_error"));
    }
  };

  // Функция для рендеринга звёзд на основе рейтинга
  const renderStars = (rating, isInteractive = false) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    const stars = [];
    let starIndex = 0;

    // Заполненные звёзды
    for (let i = 0; i < fullStars; i++) {
      const value = i + 1;
      stars.push(
        <AiFillStar
          key={`full-${starIndex++}`}
          color="#ffd700"
          size={16}
          onClick={isInteractive ? () => handleStarClick(value) : undefined}
          className={isInteractive ? "interactive-star" : ""}
        />
      );
    }

    // Половинная звезда
    if (hasHalfStar) {
      const value = fullStars + 1;
      stars.push(
        <FaStarHalfAlt
          key={`half-${starIndex++}`}
          color="#ffd700"
          size={16}
          onClick={isInteractive ? () => handleStarClick(value) : undefined}
          className={isInteractive ? "interactive-star" : ""}
        />
      );
    }

    // Пустые звёзды
    for (let i = 0; i < emptyStars; i++) {
      const value = fullStars + (hasHalfStar ? 1 : 0) + i + 1;
      stars.push(
        <AiOutlineStar
          key={`empty-${starIndex++}`}
          color="#ffd700"
          size={16}
          onClick={isInteractive ? () => handleStarClick(value) : undefined}
          className={isInteractive ? "interactive-star" : ""}
        />
      );
    }

    return <div className={isInteractive ? "star-rating interactive" : "star-rating"}>{stars}</div>;
  };

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

  return (
    <div className="course-detail-container">
      <div className="course-header">
        <h1>{course?.title}</h1>
      </div>

      <div className="course-meta">
        {isLoading ? (
          <p>Loading course details...</p>
        ) : (
          <>
            <div className="tutor-avatar">
              <img
                src={avatarUrl}
                alt="Tutor Avatar"
                className="course-avatar"
                onError={handleImageError} // Обработчик ошибки загрузки
              />
            </div>
            <p>{course?.description}</p>
            <p>
              <strong>{course?.price_per_hour} {t("course.som_per_hour")}</strong>
            </p>
            <p>
              {t("course.location")}: {t(`course.${course?.location_type}`)}
            </p>
            <p>
              {t("course.group")}: {t(`course.${course?.group_size}`)}
            </p>
          </>
        )}
      </div>

      <div className="tutor-info">
        <h3>{t("course.tutor")}: <strong>{userData?.full_name}</strong></h3>
        <p>{t("course.email")}: {userData?.email}</p>
        <p>{t("course.phone")}: {userData?.phone || t("course.not_provided")}</p>
        <p>{t("course.location")}: {userData?.location || t("course.not_provided")}</p>
        {userData?.telegram && (
          <p>{t("course.telegram")}: <a href={userData.telegram} target="_blank" rel="noopener noreferrer">{userData.telegram}</a></p>
        )}
        {userData?.instagram && (
          <p>{t("course.instagram")}: <a href={userData.instagram} target="_blank" rel="noopener noreferrer">{userData.instagram}</a></p>
        )}
        {userData?.whatsapp && (
          <p>{t("course.whatsapp")}: <a href={userData.whatsapp} target="_blank" rel="noopener noreferrer">{userData.whatsapp}</a></p>
        )}
      </div>

      {isOwner && (
        <div className="owner-actions">
          <button className="btn-edit" onClick={handleEdit}>{t("course.edit")}</button>
          <button className="btn-delete" onClick={handleDelete}>{t("course.delete")}</button>
        </div>
      )}

      <div className="reviews-section">
        <h3>{t("course.reviews")}</h3>
        {reviews.length === 0 ? (
          <p>{t("course.no_reviews")}</p>
        ) : (
          reviews.map((r, idx) => (
            <div key={idx} className="review-box">
              <div className="stars">{renderStars(Number(r.rating))}</div>
              <p>{r.comment}</p>
            </div>
          ))
        )}

        {!isOwner && auth.currentUser && (
          <form onSubmit={handleReviewSubmit} className="review-form">
            <h4>{t("course.leave_review")}</h4>
            {renderStars(reviewForm.rating, true)}
            <textarea
              name="comment"
              value={reviewForm.comment}
              onChange={handleReviewChange}
              placeholder={t("course.comment_placeholder")}
              required
            />
            <button type="submit">{t("course.submit_review")}</button>
          </form>
        )}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    </div>
  );
};

export default CourseView;
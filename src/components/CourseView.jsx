import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { useTranslation } from "react-i18next";
import "../styles/CourseView.css";

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [userData, setUserData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: "", comment: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseRes = await fetch(`${import.meta.env.VITE_API_URL}/courses`);
        const allCourses = await courseRes.json();
        const selected = allCourses.find((c) => c.id === courseId);
        setCourse(selected);

        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/user/${selected.teacher_id}`);
        const user = await userRes.json();
        setUserData(user);

        const reviewRes = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}/reviews`);
        const reviewData = await reviewRes.json();
        setReviews(reviewData);

        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === selected.teacher_id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error loading course:", error);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleDelete = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: "DELETE",
      });
      navigate("/");
    } catch (err) {
      console.error("Error deleting course", err);
    }
  };

  const handleEdit = () => navigate(`/course/edit/${courseId}`);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const currentUser = auth.currentUser;
    if (!currentUser) return setError(t("course.login_first"));
    if (currentUser.uid === course.teacher_id) return setError(t("course.cannot_review_own"));

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
        setReviewForm({ rating: "", comment: "" });
        setReviews((prev) => [...prev, { ...result, rating: reviewForm.rating, comment: reviewForm.comment }]);
      } else {
        setError(result.error || t("course.review_submit_fail"));
      }
    } catch (err) {
      setError(t("course.network_error"));
    }
  };

  return (
    <div className="course-detail-container">
      <div className="course-header">
        <h1>{course?.title}</h1>
      </div>

      <div className="course-meta">
        <p>{course?.description}</p>
        <p><strong>{course?.price_per_hour} {t("course.som_per_hour")}</strong></p>
        <p>{t("course.location")}: {t(`course.${course?.location_type}`)}</p>
        <p>{t("course.group")}: {t(`course.${course?.group_size}`)}</p>
      </div>

      <div className="tutor-info">
        <h3>{t("course.tutor")}: <strong>{userData?.full_name}</strong></h3>
        <p>{t("course.email")}: {userData?.email}</p>
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
              <p><strong>{r.rating}/5</strong></p>
              <p>{r.comment}</p>
            </div>
          ))
        )}

        {!isOwner && auth.currentUser && (
          <form onSubmit={handleReviewSubmit} className="review-form">
            <h4>{t("course.leave_review")}</h4>
            <input
              type="number"
              name="rating"
              min="1"
              max="5"
              required
              value={reviewForm.rating}
              onChange={handleReviewChange}
              placeholder={t("course.rating_placeholder")}
            />
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
      </div>
    </div>
  );
};

export default CourseView;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { endpoints } from "../api/endpoints";
import { apiClient } from "../api/http";
import { useTranslation } from "react-i18next";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaStarHalfAlt } from "react-icons/fa";
import ConfirmModal from "./ui/ConfirmModal";
import { Spinner, ErrorState, EmptyState } from "./ui/Primitives";
import BookingModal from "./booking/BookingModal";
import { useTutorAvailability } from "../hooks/useTutorAvailability";
import "../styles/CourseView.css";

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { openAuth } = useUIStore();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [fetchError, setFetchError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showBooking, setShowBooking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [enrollmentStatus, setEnrollmentStatus] = useState("NOT_REQUESTED");
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ message: "", preferred_schedule: "" });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [canReview, setCanReview] = useState(null);

  const teacherName = course?.teacher_name || course?.teacherName || "";
  const teacherAvatar = course?.teacher_avatar || course?.teacherAvatar || "";
  const price = course?.price_per_hour || course?.price || null;
  const { availability: tutorAvailability } = useTutorAvailability(course?.teacher_id);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        const { response, data } = await apiClient.get(endpoints.courses.byId(courseId));
        if (response.ok) {
          setCourse(data);
          if (currentUser && currentUser.id === data.teacher_id) setIsOwner(true);
        } else {
          setFetchError(data.error || t("course.fetch_error"));
        }

        const { response: revRes, data: revData } = await apiClient.get(endpoints.reviews.list(courseId), false);
        if (revRes.ok && Array.isArray(revData)) {
          setReviews(revData);
        }

        if (isAuthenticated && currentUser && currentUser.id !== data?.teacher_id) {
          // GET /courses/{id}/enrollment returns { id, status } for the current student
          const { response: enrRes, data: enrData } = await apiClient.get(endpoints.enrollments.forCourse(courseId));
          if (enrRes.ok && enrData?.status) {
            setEnrollmentStatus(enrData.status);
            setEnrollmentId(enrData.id || null);
          }
        }

        if (isAuthenticated && currentUser && currentUser.role === "STUDENT" && data?.teacher_id !== currentUser.id) {
            try {
                const { response: crRes, data: crData } = await apiClient.get(
                    endpoints.courses.canReview(courseId)
                );
                if (crRes.ok) setCanReview(crData?.eligible ? crData : null);
            } catch {
                // не блокируем загрузку страницы
            }
        }
      } catch {
        setFetchError(t("course.fetch_error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, t, currentUser, isAuthenticated]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { response } = await apiClient.delete(endpoints.courses.delete(courseId));
      if (response.ok) navigate("/");
      else setFetchError(t("course.delete_error"));
    } catch {
      setFetchError(t("course.delete_error"));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => navigate(`/tutor/courses/edit/${courseId}`);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStarClick = (value) => {
    setReviewForm((prev) => ({
      ...prev,
      rating: prev.rating === value ? 0 : value,
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!isAuthenticated || !currentUser) return setReviewError(t("course.login_first"));
    if (currentUser.id === course.teacher_id) return setReviewError(t("course.cannot_review_own"));
    if (reviewForm.rating === 0) return setReviewError(t("course.rating_required"));

    try {
      const { response, data: result } = await apiClient.post(
        endpoints.reviews.create(courseId),
        { rating: reviewForm.rating, comment: reviewForm.comment }
      );
      if (response.ok) {
        setReviewSuccess(t("course.review_submitted"));
        setReviewForm({ rating: 0, comment: "" });
        setReviews((prev) => [...prev, { ...result, rating: reviewForm.rating, comment: reviewForm.comment, student_name: currentUser.full_name, student_avatar: currentUser.avatar }]);
      } else {
        setReviewError(result.error || t("course.review_submit_fail"));
      }
    } catch {
      setReviewError(t("course.network_error"));
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setEnrollError("");
    setEnrollSuccess("");
    setEnrollLoading(true);
    try {
      const { response, data: result } = await apiClient.post(endpoints.enrollments.enroll(courseId), {
        message: enrollForm.message,
        preferred_schedule: enrollForm.preferred_schedule,
      });
      if (response.ok) {
        setEnrollmentStatus("PENDING");
        setEnrollmentId(result?.id || null);
        setShowEnrollForm(false);
        setEnrollSuccess(t("course_enroll.request_sent", "Request sent! The tutor will review it."));
      } else if (response.status === 409) {
        setEnrollError(t("course_enroll.already_requested", "You have already requested this course"));
      } else {
        setEnrollError(result?.error || result?.message || t("course_enroll.request_fail", "Failed to send request"));
      }
    } catch {
      setEnrollError(t("course.network_error", "Network error"));
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!enrollmentId) return;
    setEnrollLoading(true);
    try {
      await apiClient.delete(endpoints.enrollments.cancel(enrollmentId));
      setEnrollmentStatus("NOT_REQUESTED");
      setEnrollmentId(null);
      setEnrollForm({ message: "", preferred_schedule: "" });
    } catch {
      setEnrollError(t("course.network_error", "Network error"));
    } finally {
      setEnrollLoading(false);
      setShowCancelRequest(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
    : null;

  const renderStars = (rating, isInteractive = false) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);
    const stars = [];
    let starIndex = 0;

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

  const getDefaultAvatar = (name) => {
    if (!name) return "https://via.placeholder.com/150";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=150`;
  };

  const handleImageError = (e) => {
    e.target.src = getDefaultAvatar(teacherName || "Instructor");
  };

  if (isLoading) return <div className="course-detail-container"><Spinner label={t("common.loading")} /></div>;
  if (fetchError && !course) return <div className="course-detail-container"><ErrorState message={fetchError} /></div>;
  if (!course) return <div className="course-detail-container"><EmptyState icon="📚" title={t("course.not_found", "Course not found")} /></div>;

  return (
    <div className="course-detail-container">
      <div className="course-header">
        <h1>{course?.title}</h1>
      </div>

      <div className="course-meta">
            <div className="tutor-avatar">
              <img
                src={teacherAvatar || getDefaultAvatar(teacherName)}
                alt={teacherName}
                className="course-avatar"
                onError={handleImageError}
              />
            </div>
            <p>{course.description}</p>
            {averageRating && (
              <div className="average-rating">
                {renderStars(Number(averageRating))}
                <span>{averageRating} ({reviews.length} {t("course.reviews_count", "reviews")})</span>
              </div>
            )}
            <p>
              <strong>{price != null ? `${price} ${t("course.som_per_hour")}` : t("common.price_not_set", "Price not set")}</strong>
            </p>
            <p>{t("course.location")}: {course?.location_type ? t(`course.location_type.${course?.location_type}`, course?.location_type) : "—"}</p>
            <p>{t("course.group")}: {course?.group_size ? t(`course.group_type.${course?.group_size}`, course?.group_size) : "—"}</p>
            {course.subject && <p>{t("course.subject_label", "Subject")}: {typeof course.subject === "string" ? (t(`course.subject.${course.subject}`, course.subject)) : course.subject}</p>}

            {teacherName && (
            <div className="tutor-info">
              <h3>
                {t("course.tutor")}:
                <Link to={`/tutor/${course.teacher_id}`} className="tutor-link">
                  <strong>{teacherName}</strong>
                </Link>
              </h3>
            </div>
            )}

            {!isOwner && !isAuthenticated && (
              <div className="guest-cta-bar">
                <button
                  type="button"
                  className="btn book-lesson-btn"
                  onClick={openAuth}
                >
                  {t("course.login_to_enroll", "Log in to enroll")}
                </button>
              </div>
            )}

            {!isOwner && isAuthenticated && (
              <div className="booking-section">
                {enrollmentStatus === "PENDING" && (
                  <div className="enrollment-state">
                    <span className="status-badge status-pending">
                      {t("course_enroll.request_pending", "Request pending — waiting for tutor's response")}
                    </span>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowCancelRequest(true)}
                      disabled={enrollLoading}
                    >
                      {t("common.cancel_request", "Cancel request")}
                    </button>
                  </div>
                )}

                {(enrollmentStatus === "ACCEPTED" || enrollmentStatus === "COMPLETED" || enrollmentStatus === "ENROLLED") && (
                  <>
                    <p className="success-message">{t("course_enroll.request_accepted", "You are enrolled in this course 🎉")}</p>
                    <button className="btn book-lesson-btn" onClick={() => setShowBooking(true)}>
                      {t("course.book_lesson", "Book Lesson")}
                    </button>
                  </>
                )}

                {enrollmentStatus === "REJECTED" && (
                  <p className="error-message">{t("course_enroll.request_rejected", "Your request was declined by the tutor.")}</p>
                )}

                {(enrollmentStatus === "NOT_REQUESTED" || !enrollmentStatus) && (
                  <>
                    {!showEnrollForm ? (
                      <button className="btn book-lesson-btn" onClick={() => setShowEnrollForm(true)}>
                        {t("course_enroll.request_to_join", "Request to join")}
                      </button>
                    ) : (
                      <form className="booking-form" onSubmit={handleEnrollSubmit}>
                        <h4>{t("course_enroll.request_form_title", "Join this course")}</h4>
                        <div className="form-field">
                          <label htmlFor="enroll-message">{t("course_enroll.message_label", "Message to tutor")}</label>
                          <textarea
                            id="enroll-message"
                            rows={3}
                            value={enrollForm.message}
                            onChange={(e) => setEnrollForm((prev) => ({ ...prev, message: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="enroll-schedule">{t("course_enroll.preferred_schedule", "Preferred schedule")}</label>
                          <input
                            id="enroll-schedule"
                            type="text"
                            value={enrollForm.preferred_schedule}
                            onChange={(e) => setEnrollForm((prev) => ({ ...prev, preferred_schedule: e.target.value }))}
                            placeholder={t("course_enroll.preferred_schedule_hint", "e.g. weekdays after 18:00")}
                          />
                        </div>
                        {enrollError && <p className="error-message">{enrollError}</p>}
                        {enrollSuccess && <p className="success-message">{enrollSuccess}</p>}
                        <div className="form-actions">
                          <button type="button" className="cancel-btn" onClick={() => setShowEnrollForm(false)}>
                            {t("course.cancel", "Cancel")}
                          </button>
                          <button type="submit" className="create-btn" disabled={enrollLoading}>
                            {enrollLoading ? t("common.sending", "Sending...") : t("course_enroll.send_request", "Send request")}
                          </button>
                        </div>
                      </form>
                    )}
                    {enrollSuccess && !showEnrollForm && <p className="success-message">{enrollSuccess}</p>}
                  </>
                )}
              </div>
            )}
      </div>

      {isOwner && (
        <div className="owner-actions">
          <button className="btn-edit" onClick={handleEdit}>{t("course.edit")}</button>
          <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>{t("course.delete")}</button>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelRequest}
        title={t("student_requests.cancel_title", "Cancel request?")}
        message={t("course_enroll.cancel_request_message", "Your join request will be withdrawn.")}
        confirmLabel={t("common.cancel_request", "Cancel request")}
        loading={enrollLoading}
        onCancel={() => setShowCancelRequest(false)}
        onConfirm={handleCancelRequest}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t("course.delete_confirm_title", "Delete course?")}
        message={t("course.delete_confirm_message", "This action cannot be undone.")}
        confirmLabel={t("common.delete", "Delete")}
        loading={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      <div className="reviews-section">
        <h3>{t("course.reviews")}</h3>
        {reviews.length === 0 ? (
          <p>{t("course.no_reviews")}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id ?? r._id ?? r.student_name} className="review-box">
              <div className="review-header">
                <img
                  src={r.student_avatar || getDefaultAvatar(r.student_name || "Student")}
                  alt={r.student_name || "Student"}
                  className="review-avatar"
                  onError={(e) => { e.target.src = getDefaultAvatar("Student"); }}
                />
                <span className="review-author">{r.student_name || "Student"}</span>
                <div className="stars">{renderStars(Number(r.rating))}</div>
              </div>
              <p>{r.comment}</p>
            </div>
          ))
        )}

        {isAuthenticated && currentUser?.role === "STUDENT" && !isOwner && (
            <>
                {canReview?.eligible && (
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
                {canReview?.has_attended && canReview?.already_reviewed && (
                    <p style={{ color: "var(--color-success, #38a169)", marginTop: 8 }}>
                        ✅ {t("course.review_submitted", "Review submitted successfully")}
                    </p>
                )}
                {canReview !== null && !canReview?.has_attended && (
                    <p style={{ color: "var(--color-text-secondary, #666)", marginTop: 8, fontSize: 14 }}>
                        {t("course_enroll.review_after_lesson", "You can leave a review after attending at least one lesson")}
                    </p>
                )}
            </>
        )}
        {reviewError && <p className="error-message">{reviewError}</p>}
        {reviewSuccess && <p className="success-message">{reviewSuccess}</p>}
      </div>

      <BookingModal
        course={course}
        availability={tutorAvailability}
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
      />
    </div>
  );
};

export default CourseView;

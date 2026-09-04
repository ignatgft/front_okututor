// migrated to TSX — minimal strict types (controlled)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { endpoints } from "../api/endpoints";
import { apiClient } from "../api/http";
import { useTranslation } from "react-i18next";
import { Star, StarHalf } from "lucide-react";
import ConfirmModal from "./ui/ConfirmModal";
import { Spinner, ErrorState, EmptyState } from "./ui/Primitives";
import ApplicationWizard from "./course/ApplicationWizard";
import { resolveCourseCta } from "./course/CourseCta";
import { ENROLLMENT_STATUS } from "../constants/enums";
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

  const [showApplication, setShowApplication] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [enrollmentStatus, setEnrollmentStatus] = useState("NOT_REQUESTED");
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [canReview, setCanReview] = useState(null);

  const teacherName = course?.teacher_name || course?.teacherName || "";
  const teacherAvatar = course?.teacher_avatar || course?.teacherAvatar || "";
  const price = course?.price_per_hour || course?.price || null;

  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  useEffect(() => {
    let cancelled = false;
    const fetchCourse = async () => {
      setIsLoading(true);
      setFetchError("");
      let courseData = null;
      try {
        const { response, data } = await apiClient.get(endpoints.courses.byId(courseId));
        if (cancelled) return;
        if (response.ok) {
          courseData = data;
          setCourse(data);
          setIsOwner(!!(currentUserId && data.teacher_id === currentUserId));
        } else {
          setFetchError(data?.error || data?.message || t("course.fetch_error"));
          courseData = null;
        }

        const { response: revRes, data: revData } = await apiClient.get(endpoints.reviews.list(courseId), false);
        if (cancelled) return;
        if (revRes.ok && Array.isArray(revData)) {
          setReviews(revData);
        } else if (revRes.ok && revData && Array.isArray(revData.content)) {
          setReviews(revData.content);
        }

        if (isAuthenticated && currentUserId && courseData && currentUserId !== courseData.teacher_id) {
          try {
            const { response: enrRes, data: enrData } = await apiClient.get(endpoints.enrollments.forCourse(courseId));
            if (cancelled) return;
            if (enrRes.ok && enrData?.status) {
              setEnrollmentStatus(enrData.status);
              setEnrollmentId(enrData.id || null);
            } else {
              setEnrollmentStatus(ENROLLMENT_STATUS.NOT_REQUESTED);
              setEnrollmentId(null);
            }
          } catch {
            if (!cancelled) {
              setEnrollmentStatus(ENROLLMENT_STATUS.NOT_REQUESTED);
            }
          }
        } else {
          setEnrollmentStatus(ENROLLMENT_STATUS.NOT_REQUESTED);
          setEnrollmentId(null);
        }

        if (isAuthenticated && currentUserRole === "STUDENT" && courseData && courseData.teacher_id !== currentUserId) {
            try {
                const { response: crRes, data: crData } = await apiClient.get(
                    endpoints.courses.canReview(courseId)
                );
                if (cancelled) return;
                if (crRes.ok) setCanReview(crData?.eligible ? crData : null);
                else setCanReview(null);
            } catch {
                if (!cancelled) setCanReview(null);
            }
        } else {
          setCanReview(null);
        }
      } catch {
        if (!cancelled) setFetchError(t("course.fetch_error"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCourse();
    return () => { cancelled = true; };
  }, [courseId, t, currentUserId, currentUserRole, isAuthenticated]);

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
        <Star
          key={`full-${starIndex++}`}
          size={16}
          color="#ffd700"
          fill="#ffd700"
          onClick={isInteractive ? () => handleStarClick(value) : undefined}
          className={isInteractive ? "interactive-star" : ""}
        />
      );
    }
    if (hasHalfStar) {
      const value = fullStars + 1;
      stars.push(
        <StarHalf
          key={`half-${starIndex++}`}
          size={16}
          color="#ffd700"
          fill="#ffd700"
          onClick={isInteractive ? () => handleStarClick(value) : undefined}
          className={isInteractive ? "interactive-star" : ""}
        />
      );
    }
    for (let i = 0; i < emptyStars; i++) {
      const value = fullStars + (hasHalfStar ? 1 : 0) + i + 1;
      stars.push(
        <Star
          key={`empty-${starIndex++}`}
          size={16}
          color="#ffd700"
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
  if (!course) return <div className="course-detail-container"><EmptyState title={t("course.not_found", "Course not found")} /></div>;

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
                {(() => {
                  const cta = resolveCourseCta(enrollmentStatus, { t, isOwner, isAuthenticated });
                  if (!cta) return null;
                  switch (cta.type) {
                    case "apply":
                      return (
                        <div className="enrollment-state">
                          <button
                            type="button"
                            className="btn-primary book-lesson-btn"
                            onClick={() => setShowApplication(true)}
                          >
                            {t("application.title")}
                          </button>
                        </div>
                      );
                    case "rejected":
                      return (
                        <div className="enrollment-state">
                          <span className="status-badge status-danger">{t(cta.key)}</span>
                          {enrollmentId && (
                            <Link to={`/student/requests/${enrollmentId}`} className="btn-secondary book-lesson-btn">
                              {t("request_detail.view_schedule")}
                            </Link>
                          )}
                        </div>
                      );
                    case "pending":
                    case "needs_info":
                      return (
                        <div className="enrollment-state">
                          <span className="status-badge status-warning">{t(cta.key)}</span>
                          {enrollmentId && (
                            <Link to={`/student/requests/${enrollmentId}`} className="btn-secondary book-lesson-btn">
                              {t("request_detail.view_schedule")}
                            </Link>
                          )}
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => navigate(`/student/messages?filter=direct`)}
                          >
                            {t("request_detail.message_tutor")}
                          </button>
                        </div>
                      );
                    case "schedule_pending":
                    case "confirm_schedule":
                      return (
                        <div className="enrollment-state">
                          <span className="status-badge status-warning">{t(cta.key)}</span>
                          {enrollmentId && (
                            <button
                              type="button"
                              className="btn-primary book-lesson-btn"
                              onClick={() => navigate(`/student/requests/${enrollmentId}`)}
                            >
                              {cta.type === "confirm_schedule" ? t("request_detail.accept_schedule") : t("request_detail.accept_schedule")}
                            </button>
                          )}
                        </div>
                      );
                    case "view_schedule":
                    case "review":
                      return (
                        <div className="enrollment-state">
                          <span className="status-badge status-success">{t(cta.key)}</span>
                          {enrollmentId && (
                            <button
                              type="button"
                              className="btn-primary book-lesson-btn"
                              onClick={() => navigate(`/student/requests/${enrollmentId}`)}
                            >
                              {t("request_detail.view_schedule")}
                            </button>
                          )}
                        </div>
                      );
                    default:
                      return null;
                  }
                })()}
              </div>
            )}
      </div>

      {isOwner && (
        <div className="owner-actions">
          <button className="btn-edit" onClick={handleEdit}>{t("course.edit")}</button>
          <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>{t("course.delete")}</button>
        </div>
      )}

      <ApplicationWizard
        courseId={courseId}
        isOpen={showApplication}
        onClose={() => setShowApplication(false)}
        onSuccess={() => {
          setEnrollmentStatus(ENROLLMENT_STATUS.PENDING);
        }}
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
                        {t("course.review_submitted", "Review submitted successfully")}
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

      {(() => {
        const cta = resolveCourseCta(enrollmentStatus, { t, isOwner, isAuthenticated });
        if (!isAuthenticated || isOwner || !cta) return null;
        const apply = cta.type === "apply";
        return (
          <div className="course-sticky-cta" aria-hidden={!apply}>
            {apply ? (
              <button type="button" className="btn-primary btn-block" onClick={() => setShowApplication(true)}>
                {t("application.title")}
              </button>
            ) : (
              <Link to={`/student/requests/${enrollmentId || ""}`} className="btn-secondary btn-block">
                {t("request_detail.view_schedule")}
              </Link>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default CourseView;

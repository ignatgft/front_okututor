import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { reviewsApi } from "../../api/reviews.api";

const ReviewModal = ({ isOpen, booking, onClose, onSubmitted }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    submitRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = document.querySelectorAll(".confirm-box button:not([disabled]), .confirm-box textarea");
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError(t("review.rating_required", "Please select a rating"));
      return;
    }

    setLoading(true);
    try {
      const { response, data } = await reviewsApi.createForBooking(booking.course_id, booking.id, { rating, comment });
      if (!response.ok) throw new Error(data?.error || data?.message || t("review.submit_fail", "Failed to submit review"));
      setRating(0);
      setComment("");
      onSubmitted(booking);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("review.title")}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h3>{t("review.title", "How was your lesson?")}</h3>
        <p className="review-course-name">{booking.course_title}</p>
        <form onSubmit={handleSubmit}>
          <div className="review-stars-input" role="radiogroup" aria-label={t("review.rating_label", "Rating")}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="review-star-btn"
                onClick={() => setRating(value)}
                aria-checked={rating === value}
                aria-label={`${t("review.rating_label", "Rating")}: ${value}`}
              >
                {value <= rating ? <AiFillStar color="#ffd700" size={28} /> : <AiOutlineStar color="#ffd700" size={28} />}
              </button>
            ))}
          </div>
          <textarea
            className="review-comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("course.comment_placeholder", "Your comment")}
            rows={4}
          />
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="confirm-actions">
            <button type="button" className="confirm-cancel" onClick={onClose}>
              {t("common.cancel", "Cancel")}
            </button>
            <button ref={submitRef} type="submit" className="confirm-accept" disabled={loading}>
              {loading ? <span aria-busy="true">{t("common.loading", "Loading...")}</span> : t("course.submit_review", "Submit Review")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;

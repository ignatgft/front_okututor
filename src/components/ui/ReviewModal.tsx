import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { reviewsApi } from "../../api/reviews.api";
import type { BookingDTO } from "../../types/api";

export interface ReviewModalProps {
  isOpen: boolean;
  booking: BookingDTO | null | undefined;
  onClose: () => void;
  onSubmitted: (booking: BookingDTO) => void;
}

const ReviewModal = ({ isOpen, booking, onClose, onSubmitted }: ReviewModalProps): JSX.Element | null => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    submitRef.current?.focus();
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = document.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>(".confirm-box button:not([disabled]), .confirm-box textarea");
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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError(t("review.rating_required", "Please select a rating"));
      return;
    }

    setLoading(true);
    try {
      const courseId = booking.course_id as string | number;
      const bookingId = booking.id;
      const { response, data } = await reviewsApi.createForBooking(courseId, bookingId, { rating, comment });
      const rec = data as Record<string, unknown> | null;
      const msg = (rec?.["error"] as string | undefined) ?? (rec?.["message"] as string | undefined);
      if (!response.ok) throw new Error(msg || t("review.submit_fail", "Failed to submit review"));
      setRating(0);
      setComment("");
      onSubmitted(booking);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("review.title") as string}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h3>{t("review.title", "How was your lesson?")}</h3>
        <p className="review-course-name">{booking.course_title as string}</p>
        <form onSubmit={handleSubmit}>
          <div className="review-stars-input" role="radiogroup" aria-label={t("review.rating_label", "Rating") as string}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="review-star-btn"
                onClick={() => setRating(value)}
                aria-checked={rating === value}
                aria-label={`${t("review.rating_label", "Rating")}: ${value}`}
              >
                {value <= rating ? <Star color="#ffd700" fill="#ffd700" size={28} /> : <Star color="#ffd700" size={28} />}
              </button>
            ))}
          </div>
          <textarea
            className="review-comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("course.comment_placeholder", "Your comment") as string}
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

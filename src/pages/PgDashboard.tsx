// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback, useMemo } from "react";
import { isJoinable } from "../api/calendar.api";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { bookingApi } from "../api/booking.api";
import { usePageTitle } from "../components/pageTitleContext";
import ConfirmModal from "../components/ui/ConfirmModal";
import ReviewModal from "../components/ui/ReviewModal";
import { Spinner, Skeleton, ErrorState, EmptyState, Badge } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import { studentsApi } from "../api/students.api";
import { ENROLLMENT_STATUS } from "../constants/enums";
import { enrollmentStatusLabel } from "../utils/statusLabels";
import { NextLessonCard, ActionRequiredBlock, LessonDetailsModal } from "../components/schedule";
import "../styles/Dashboard.css";

export default function PgDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewedIds, setReviewedIds] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("dashboard.title") || "Главная"); }, [setPageTitle, t]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await bookingApi.my();
      if (response.ok) {
        const all = data.content || [];
        if (filter === "upcoming") {
          const now = new Date();
          setBookings(all.filter((b) => (b.status === "CONFIRMED" || b.status === "PENDING") && new Date(b.start_at) > now));
        } else if (filter === "past") {
          setBookings(all.filter((b) => b.status === "COMPLETED"));
        } else if (filter === "cancelled") {
          setBookings(all.filter((b) => b.status === "CANCELLED" || b.status === "REJECTED"));
        } else {
          setBookings(all);
        }
      }
      else setError(data.error || t("errors.default", "Something went wrong."));
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const loadEnrollments = useCallback(async () => {
    try {
      const { response, data } = await studentsApi.myEnrollments();
      if (response.ok) setEnrollments(Array.isArray(data) ? data : data.content || []);
    } catch {
      /* dashboard should not break if requests fail */
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const cancelBooking = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(cancelTarget.id);
      setCancelTarget(null);
      loadBookings();
      toast.success(t("dashboard.booking_cancelled", "Booking cancelled"));
    } catch (e) {
      toast.error(e.message || t("errors.default", "Something went wrong."));
    } finally {
      setCancelling(false);
    }
  };

  const joinLesson = (bookingId) => {
    navigate(`/lesson/${bookingId}`);
  };

  const [now, setNow] = useState(() => Date.now());
  const [joinableId, setJoinableId] = useState(null);

  const upcomingBooking = useMemo(() => {
    const nowDate = new Date();
    return bookings
      .filter((b) => b.status === "CONFIRMED" && new Date(b.start_at) > nowDate)
      .sort((a, b2) => new Date(a.start_at) - new Date(b2.start_at))[0];
  }, [bookings]);

  useEffect(() => {
    if (!upcomingBooking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [upcomingBooking]);

  useEffect(() => {
    setJoinableId(upcomingBooking && isJoinable(upcomingBooking, now) ? upcomingBooking.id : null);
  }, [upcomingBooking, now]);

  const myTutors = useMemo(() => {
    return Object.values(
      bookings.reduce((acc, b) => {
        if (!b.teacher_id || !b.teacher_name) return acc;
        if (!acc[b.teacher_id]) acc[b.teacher_id] = { id: b.teacher_id, name: b.teacher_name, lessons: 0 };
        acc[b.teacher_id].lessons += 1;
        return acc;
      }, {})
    );
  }, [bookings]);

  const canReview = (b) =>
    b.status === "COMPLETED" && b.course_id && !reviewedIds.includes(b.id) && !b.has_review;

  const upcomingRequests = useMemo(
    () =>
      enrollments.filter(
        (e) =>
          e.status === ENROLLMENT_STATUS.PENDING ||
          e.status === ENROLLMENT_STATUS.ACCEPTED ||
          e.status === ENROLLMENT_STATUS.REJECTED
      ),
    [enrollments]
  );

  const myCourses = useMemo(() => {
    const byCourse = {};
    for (const b of bookings) {
      if (!b.course_id) continue;
      const key = b.course_id;
      if (!byCourse[key]) {
        byCourse[key] = { course_id: key, title: b.course_title, teacher_name: b.teacher_name, lessons: 0 };
      }
      byCourse[key].lessons += 1;
    }
    return Object.values(byCourse);
  }, [bookings]);

  const nextLessonsPreview = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "CONFIRMED" && new Date(b.start_at) > new Date())
        .sort((a, b2) => new Date(a.start_at) - new Date(b2.start_at))
        .slice(0, 3),
    [bookings]
  );

  // Convert upcomingBooking to LessonDTO format for NextLessonCard
  const nextLesson = useMemo(() => {
    if (!upcomingBooking) return null;
    return {
      id: upcomingBooking.id,
      courseId: upcomingBooking.course_id,
      courseTitle: upcomingBooking.course_title,
      tutorId: upcomingBooking.teacher_id,
      tutorName: upcomingBooking.teacher_name,
      tutorAvatar: upcomingBooking.teacher_avatar,
      studentId: user?.id,
      startAt: upcomingBooking.start_at,
      endAt: upcomingBooking.end_at,
      timezone: user?.timezone || "UTC",
      status: "SCHEDULED",
      statusLabel: t("statuses.scheduled", "Scheduled"),
      format: "ONLINE",
      canJoin: joinableId === upcomingBooking.id,
      canCancel: true,
      canReschedule: false,
      canReview: false,
      createdAt: upcomingBooking.created_at,
      updatedAt: upcomingBooking.updated_at,
    };
  }, [upcomingBooking, user?.id, user?.timezone, joinableId, t]);

  // Mock actions for now - in real app these would come from API
  const actions = useMemo(() => {
    // Filter enrollments that need action
    return enrollments
      .filter((e) =>
        e.status === ENROLLMENT_STATUS.SCHEDULE_PENDING ||
        e.status === ENROLLMENT_STATUS.SCHEDULE_PROPOSED ||
        e.status === ENROLLMENT_STATUS.PENDING
      )
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        type: "SCHEDULE_NEGOTIATION",
        title: t("schedule.action.negotiation", "Согласовать расписание"),
        description: t("schedule.action.negotiation_desc", "{{tutor}} предложил время для {{course}}", { tutor: e.teacher_name || "Тьютор", course: e.course_title || "Курс" }),
        courseId: e.course_id,
        courseTitle: e.course_title,
        tutorId: e.teacher_id,
        tutorName: e.teacher_name,
        tutorAvatar: e.teacher_avatar,
        primaryAction: { label: t("schedule.action.confirm", "Подтвердить"), endpoint: `/api/v1/enrollments/${e.id}/confirm`, method: "POST", variant: "primary" },
        secondaryAction: { label: t("schedule.action.view", "Открыть"), endpoint: `/student/requests/${e.id}`, method: "GET", variant: "secondary" },
        createdAt: e.created_at,
      }));
  }, [enrollments, t]);

  return (
    <>
      <div className="dashboard-greeting">
        <h2>{t("dashboard.greeting", "Hello, {{name}}", { name: user?.full_name?.split(" ")[0] || "" })}</h2>
      </div>

      {/* NEXT LESSON CARD */}
      <NextLessonCard
        lesson={nextLesson}
        onJoin={joinLesson}
        onViewDetails={(lesson) => setSelectedLesson(lesson)}
      />

      {/* ACTION REQUIRED BLOCK */}
      <ActionRequiredBlock
        actions={actions}
        onActionClick={(action) => {
          if (action.method === "GET") {
            navigate(action.endpoint);
          } else {
            // For POST actions, we'd call the API
            console.log("Action:", action);
          }
        }}
      />

      {!loading && myTutors.length > 0 && (
        <div className="pending-section">
          <h2>{t("dashboard.my_tutors", "My tutors")}</h2>
          <div className="bookings-list">
            {myTutors.map((tutor) => (
              <Link key={tutor.id} to={`/tutor/${tutor.id}`} className="booking-card tutor-mini-card">
                <div className="booking-info">
                  <h3>{tutor.name}</h3>
                  <p>{t("dashboard.lessons_count", "{{count}} lessons", { count: tutor.lessons })}</p>
                </div>
                <span className="btn-link">{t("tutor_profile.view_profile", "View profile")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && myCourses.length > 0 && (
        <div className="pending-section">
          <h2>{t("dashboard.my_courses", "My courses")}</h2>
          <div className="bookings-list">
            {myCourses.map((course) => (
              <Link key={course.course_id} to={`/course/${course.course_id}`} className="booking-card tutor-mini-card">
                <div className="booking-info">
                  <h3>{course.title}</h3>
                  <p>{course.teacher_name}</p>
                  <p>{t("dashboard.lessons_count", "{{count}} lessons", { count: course.lessons })}</p>
                </div>
                <span className="btn-link">{t("dashboard.open", "Open")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && upcomingRequests.length > 0 && (
        <div className="pending-section">
          <h2>{t("dashboard.my_requests", "My requests")}</h2>
          <div className="bookings-list">
            {upcomingRequests.slice(0, 5).map((e2) => (
              <div key={e2.id} className="booking-card">
                <div className="booking-info">
                  <h3>{e2.course_title || e2.course?.title}</h3>
                  <p>{e2.teacher_name || ""}</p>
                </div>
                <Badge status={e2.status}>{enrollmentStatusLabel(e2.status, t)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && nextLessonsPreview.length > 0 && (
        <div className="pending-section">
          <h2>{t("dashboard.schedule_preview", "Schedule")}</h2>
          <div className="bookings-list">
            {nextLessonsPreview.map((b) => (
              <button key={b.id} type="button" className="booking-card schedule-preview-row" onClick={() => navigate(`/lesson/${b.id}`)}>
                <div className="booking-info">
                  <h3>{b.course_title}</h3>
                  <p className="booking-time">
                    {new Date(b.start_at).toLocaleDateString(i18n.language, { day: "numeric", month: "long" })}
                    {" · "}
                    {new Date(b.start_at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </p>
                </div>
                <span className="btn-link">{t("dashboard.join_lesson", "Join")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-tabs">
        {["upcoming", "past", "cancelled", "all"].map((f) => (
          <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {t(`dashboard.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bookings-list">
        {loading && (
          <>
            <Skeleton count={1} className="skeleton-card" />
            <Skeleton count={1} className="skeleton-card" />
            <Skeleton count={1} className="skeleton-card" />
          </>
        )}

        {!loading && error && (
          <ErrorState message={error} onRetry={loadBookings} />
        )}

        {!loading && !error && bookings.length === 0 && (
          <EmptyState
            icon="📚"
            title={t("dashboard.no_bookings", "No bookings found")}
            hint={t("dashboard.find_tutors", "Find tutors and book a lesson.")}
          />
        )}

        {!loading && !error && bookings.map((b) => (
          <div key={b.id} className="booking-card">
            <div className="booking-info">
              <h3>{b.course_title}</h3>
              <p>{b.teacher_name}</p>
              <p className="booking-time">
                {new Date(b.start_at).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" })}
                {new Date(b.start_at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {new Date(b.end_at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
              </p>
              <span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span>
            </div>
            <div className="booking-actions">
              {b.status === "CONFIRMED" && (
                <button className="btn-primary" onClick={() => joinLesson(b.id)}>
                  {t("dashboard.join_lesson") || "Join Lesson"}
                </button>
              )}
              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button className="btn-secondary" onClick={() => setCancelTarget(b)}>
                  {t("dashboard.cancel") || "Cancel"}
                </button>
              )}
              {canReview(b) && (
                <button className="btn-primary" onClick={() => setReviewTarget(b)}>
                  {t("review.leave_review", "Leave review")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        title={t("booking.cancel_title", "Cancel this lesson?")}
        message={t("booking.cancel_message", "Your booking request will be withdrawn.")}
        confirmLabel={t("booking.cancel_confirm", "Cancel booking")}
        loading={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={cancelBooking}
      />

      <ReviewModal
        isOpen={!!reviewTarget}
        booking={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmitted={(b) => setReviewedIds((prev) => [...prev, b.id])}
      />

      <LessonDetailsModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onChanged={() => {
          loadBookings();
        }}
      />
    </>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { enrollmentsApi } from "../api/enrollments.api";
import { usePageTitle } from "../components/pageTitleContext";
import { Spinner, EmptyState, ErrorState, Badge } from "../components/ui/Primitives";
import { useToast } from "../components/ui/Toast";
import ScheduleModal from "../components/ScheduleModal";
import { openDirectChat, canAssignSchedule, canReschedule } from "../utils/enrollmentHelpers";
import { enrollmentStatusLabel } from "../utils/statusLabels";
import "../styles/Dashboard.css";

export default function PgTutorStudents() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("students.title", "My Students")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookRes, enrRes] = await Promise.all([
        bookingApi.teacher(),
        enrollmentsApi.tutorRequests().catch(() => ({ response: { ok: false }, data: [] })),
      ]);
      if (bookRes.response.ok) setBookings(bookRes.data.content || []);
      else setBookings([]);
      if (enrRes.response?.ok) {
        const arr = Array.isArray(enrRes.data) ? enrRes.data : enrRes.data.content || [];
        setEnrollments(arr);
      }
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const students = Object.values(
    bookings.reduce((acc, b) => {
      if (!b.student_id) return acc;
      if (!acc[b.student_id]) {
        acc[b.student_id] = {
          id: b.student_id,
          name: b.student_name || "Student",
          courses: new Set(),
          courseIds: new Set(),
          lessons: 0,
          nextLesson: null,
        };
      }
      if (b.course_title) acc[b.student_id].courses.add(b.course_title);
      if (b.course_id) acc[b.student_id].courseIds.add(b.course_id);
      acc[b.student_id].lessons += 1;
      if (b.status === "CONFIRMED" && (!acc[b.student_id].nextLesson || new Date(b.start_at) < new Date(acc[b.student_id].nextLesson.start_at))) {
        acc[b.student_id].nextLesson = b;
      }
      return acc;
    }, {})
  );

  // enrich with enrollment for actions
  const enrollmentByStudent = {};
  for (const e of enrollments) {
    const sid = e.student_id || e.student?.id;
    if (sid && !enrollmentByStudent[sid]) enrollmentByStudent[sid] = e;
  }

  const locale = i18n.language || "ru";

  return (
    <>
      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : students.length === 0 ? (
        <EmptyState
          title={t("students.no_students", "No students yet")}
          hint={t("students.no_students_hint", "They will appear here after you confirm a booking.")}
        />
      ) : (
        <div className="bookings-list">
          {students.map((s) => {
            const enrollment = enrollmentByStudent[s.id];
            const courseId = s.courseIds.size ? [...s.courseIds][0] : enrollment?.course_id || enrollment?.course?.id || null;
            return (
              <div key={s.id} className="booking-card">
                <div className="booking-info">
                  <h3>{s.name}</h3>
                  <p>{[...s.courses].join(", ")}</p>
                  <p className="booking-time">
                    {s.nextLesson
                      ? `${t("students.next_lesson", "Next lesson")}: ${new Date(s.nextLesson.start_at).toLocaleDateString(locale)} ${new Date(s.nextLesson.start_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
                      : t("students.lessons_count", "{{count}} lessons", { count: s.lessons })}
                  </p>
                  {enrollment && (
                    <p className="booking-meta">
                      <Badge status={enrollment.status}>{enrollmentStatusLabel(enrollment.status, t)}</Badge>
                    </p>
                  )}
                </div>
                <div className="booking-actions">
                  <button type="button" className="btn-ghost" onClick={() => openDirectChat(navigate, "TUTOR", s.id)}>
                    {t("tutor_request.message_student", "Message student")}
                  </button>
                  {enrollment && canAssignSchedule(enrollment.status) && (
                    <button type="button" className="btn-primary" onClick={() => setScheduleTarget(enrollment)}>
                      {t("tutor_request.assign_schedule", "Assign schedule")}
                    </button>
                  )}
                  {enrollment && canReschedule(enrollment.status) && (
                    <button type="button" className="btn-secondary" onClick={() => setScheduleTarget(enrollment)}>
                      {t("tutor_request.reschedule", "Change schedule")}
                    </button>
                  )}
                  {courseId && (
                    <Link to={`/course/${courseId}`} className="btn-secondary">
                      {t("request_detail.course", "Course")}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {scheduleTarget && (
        <ScheduleModal
          enrollment={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onSuccess={() => {
            toast.success(t("success.action_completed", "Action completed"));
            setScheduleTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}

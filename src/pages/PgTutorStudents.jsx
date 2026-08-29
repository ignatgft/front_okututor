import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../api/booking.api";
import { usePageTitle } from "../components/pageTitleContext";
import { Spinner, EmptyState, ErrorState } from "../components/ui/Primitives";
import "../styles/Dashboard.css";

export default function PgTutorStudents() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("students.title", "My Students")); }, [setPageTitle, t]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await bookingApi.teacher();
      if (response.ok) setBookings(data.content || []);
      else setError(data.error || t("errors.default", "Something went wrong."));
    } catch (e) {
      setError(t("errors.network", "Network error") + ": " + e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const students = Object.values(
    bookings.reduce((acc, b) => {
      if (!b.student_id) return acc;
      if (!acc[b.student_id]) {
        acc[b.student_id] = {
          id: b.student_id,
          name: b.student_name || "Student",
          courses: new Set(),
          lessons: 0,
          nextLesson: null,
        };
      }
      if (b.course_title) acc[b.student_id].courses.add(b.course_title);
      acc[b.student_id].lessons += 1;
      if (b.status === "CONFIRMED" && (!acc[b.student_id].nextLesson || new Date(b.start_at) < new Date(acc[b.student_id].nextLesson.start_at))) {
        acc[b.student_id].nextLesson = b;
      }
      return acc;
    }, {})
  );

  return (
    <>
      {loading ? (
        <Spinner label={t("common.loading", "Loading...")} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="👩‍🎓"
          title={t("students.no_students", "No students yet")}
          hint={t("students.no_students_hint", "They will appear here after you confirm a booking.")}
        />
      ) : (
        <div className="bookings-list">
          {students.map((s) => (
            <div key={s.id} className="booking-card">
              <div className="booking-info">
                <h3>{s.name}</h3>
                <p>{[...s.courses].join(", ")}</p>
                <p className="booking-time">
                  {s.nextLesson
                    ? `${t("students.next_lesson", "Next lesson")}: ${new Date(s.nextLesson.start_at).toLocaleDateString()} ${new Date(s.nextLesson.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : t("students.lessons_count", "{{count}} lessons", { count: s.lessons })}
                </p>
              </div>
              <div className="booking-actions">
                <span className={`status-badge status-active`}>{t("students.lessons_count", "{{count}} lessons", { count: s.lessons })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

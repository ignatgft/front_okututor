import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { studentsApi } from "../api/students.api";
import { Spinner, EmptyState, ErrorState, Skeleton } from "../components/ui/Primitives";
import "../styles/Dashboard.css";

export default function PgStudentTutors() {
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setPageTitle = usePageTitle();
  useEffect(() => { setPageTitle(t("student_tutors.title", "My Tutors")); }, [setPageTitle, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await studentsApi.myEnrollments();
      if (response.ok) {
        setEnrollments(Array.isArray(data) ? data : data.content || []);
      } else {
        setError(data.message || data.error || t("common.error", "Error"));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const tutors = Object.values(
    enrollments.reduce((acc, e2) => {
      const id = e2.teacher_id ?? e2.course?.teacher_id;
      if (!id) return acc;
      if (!acc[id]) {
        acc[id] = {
          id,
          name: e2.teacher_name ?? e2.course?.teacher_name ?? t("common.tutor", "Tutor"),
          courses: new Set(),
        };
      }
      const title = e2.course_title ?? e2.course?.title;
      if (title) acc[id].courses.add(title);
      return acc;
    }, {})
  );

  return (
    <>
      {loading ? (
        <>
          <Spinner label={t("common.loading", "Loading...")} />
          <Skeleton count={4} />
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : tutors.length === 0 ? (
        <EmptyState
          icon="👩‍🏫"
          title={t("student_tutors.empty", "No tutors yet")}
          hint={
            <Link to="/student/search" className="btn-primary">
              {t("dashboard.find_tutors", "Find Tutors")}
            </Link>
          }
        />
      ) : (
        <div className="bookings-list">
          {tutors.map((tutor) => (
            <Link key={tutor.id} to={`/tutor/${tutor.id}`} className="booking-card tutor-mini-card">
              <div className="booking-info">
                <h3>{tutor.name}</h3>
                <p>{[...tutor.courses].join(", ")}</p>
              </div>
              <span className="btn-link">{t("tutor_profile.view_profile", "View profile")}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

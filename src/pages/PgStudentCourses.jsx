import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../components/pageTitleContext";
import { studentsApi } from "../api/students.api";
import { Badge, Spinner, Skeleton, EmptyState, ErrorState } from "../components/ui/Primitives";
import { ENROLLMENT_STATUS } from "../constants/enums";
import "../styles/Dashboard.css";

export default function PgStudentCourses() {
  const { t } = useTranslation();
  const setPageTitle = usePageTitle();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { setPageTitle(t("student_courses.title", "My Courses")); }, [setPageTitle, t]);

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
      setError(e.message || t("errors.default", "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const statusKey = (status) => `statuses.${status}`;

  const renderList = (items, emptyTitle, emptyHint) =>
    items.length === 0 ? (
      <EmptyState title={emptyTitle} hint={emptyHint} />
    ) : (
      <div className="bookings-list">
        {items.map((e2) => {
          const courseId = e2.course_id || e2.course?.id;
          const content = (
            <div className="booking-card">
              <div className="booking-info">
                <h3>{e2.course_title || e2.course?.title}</h3>
                <p>{e2.teacher_name || e2.course?.teacher_name || e2.tutor?.full_name}</p>
              </div>
              <Badge status={e2.status}>{t(statusKey(e2.status), e2.status)}</Badge>
            </div>
          );
          return courseId ? (
            <Link key={e2.id} to={`/course/${courseId}`} className="booking-card-link">
              {content}
            </Link>
          ) : (
            <div key={e2.id}>{content}</div>
          );
        })}
      </div>
    );

  const active = enrollments.filter(
    (e2) => e2.status === ENROLLMENT_STATUS.ACCEPTED || e2.status === ENROLLMENT_STATUS.COMPLETED
  );
  const pending = enrollments.filter((e2) => e2.status === ENROLLMENT_STATUS.PENDING);

  const findTutorHint = (
    <Link to="/search" className="btn-primary">
      {t("dashboard.find_tutors", "Find Tutors")}
    </Link>
  );

  return (
    <>
      {loading ? (
        <>
          <Spinner label={t("common.loading", "Loading...")} />
          <Skeleton count={3} />
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon="📚"
          title={t("student_courses.empty", "No courses yet")}
          hint={findTutorHint}
        />
      ) : (
        <>
          <section>
            <h2>{t("student_courses.active", "Active")} ({active.length})</h2>
            {renderList(active, t("student_courses.no_active", "No active courses"))}
          </section>
          <section style={{ marginTop: 24 }}>
            <h2>{t("student_courses.pending", "Pending requests")} ({pending.length})</h2>
            {renderList(pending, t("student_courses.no_pending", "No pending requests"), findTutorHint)}
          </section>
        </>
      )}
    </>
  );
}

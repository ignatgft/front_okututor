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
      <div className="courses-grid">
        {items.map((e2) => {
          const courseId = e2.course_id || e2.course?.id;
          const card = (
            <div className="course-card-admin">
              <div className="course-card-admin-header">
                <h3>{e2.course_title || e2.course?.title}</h3>
                <Badge status={e2.status}>{t(statusKey(e2.status), e2.status)}</Badge>
              </div>
              <p className="course-card-admin-desc">{e2.teacher_name || e2.course?.teacher_name || e2.tutor?.full_name || t("course.instructor_placeholder", "Instructor")}</p>
              <div className="course-card-admin-actions">
                <Link to={courseId ? `/course/${courseId}` : "#"} className="btn btn-secondary btn-sm">
                  {t("common.view", "View")}
                </Link>
                <Link to={`/student/requests/${e2.id}`} className="btn btn-ghost btn-sm">
                  {t("request_detail.view_schedule", "Details")}
                </Link>
              </div>
            </div>
          );
          return courseId ? (
            <Link key={e2.id} to={`/course/${courseId}`} className="booking-card-link" style={{ textDecoration: "none" }}>
              {card}
            </Link>
          ) : (
            <div key={e2.id}>{card}</div>
          );
        })}
      </div>
    );

  const active = enrollments.filter((e2) =>
    [ENROLLMENT_STATUS.ACCEPTED, ENROLLMENT_STATUS.SCHEDULED, ENROLLMENT_STATUS.SCHEDULE_PENDING, ENROLLMENT_STATUS.SCHEDULE_PROPOSED].includes(e2.status)
  );
  const pending = enrollments.filter((e2) =>
    [ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.NEEDS_INFO].includes(e2.status)
  );
  const hasActive = active.length > 0;
  const hasPending = pending.length > 0;
  const hasAnyRelevant = hasActive || hasPending;

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
      ) : !hasAnyRelevant && enrollments.length === 0 ? (
        <EmptyState icon="📚" title={t("student_courses.empty", "No courses yet")} hint={findTutorHint} />
      ) : !hasAnyRelevant ? (
        <EmptyState icon="📭" title={t("student_courses.empty_relevant", "No active requests")} hint={findTutorHint} />
      ) : (
        <>
          {hasActive && (
            <section>
              <h2>{t("student_courses.active", "Active")}</h2>
              {renderList(active, t("student_courses.no_active", "No active courses"))}
            </section>
          )}
          {hasPending && (
            <section style={{ marginTop: hasActive ? 24 : 0 }}>
              <h2>{t("student_courses.pending", "Pending requests")}</h2>
              {renderList(pending, t("student_courses.no_pending", "No pending requests"), findTutorHint)}
            </section>
          )}
          {!hasActive && !hasPending && (
            <EmptyState icon="📭" title={t("student_courses.empty_relevant", "No active requests")} hint={findTutorHint} />
          )}
        </>
      )}
    </>
  );
}

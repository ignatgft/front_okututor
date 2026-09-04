import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { BookingDTO } from "../../../types/api";

export interface MyCoursesWidgetProps {
  bookings: BookingDTO[];
}

export function MyCoursesWidget({ bookings }: MyCoursesWidgetProps): JSX.Element | null {
  const { t } = useTranslation();
  const myCourses = useMemo(() => {
    const byCourse: Record<string, { course_id: string | number; title: string; teacher_name?: string; lessons: number }> = {};
    for (const b of bookings) {
      if (!b.course_id) continue;
      const key = String(b.course_id);
      if (!byCourse[key]) {
        byCourse[key] = { course_id: b.course_id, title: (b.course_title as string) ?? "", teacher_name: b.teacher_name as string | undefined, lessons: 0 };
      }
      byCourse[key].lessons += 1;
    }
    return Object.values(byCourse);
  }, [bookings]);

  if (myCourses.length === 0) return null;

  return (
    <section className="dashboard-section">
      <h3>{t("dashboard.my_courses", "My courses")}</h3>
      <div className="courses-list">
        {myCourses.map((c) => (
          <Link key={String(c.course_id)} to={`/course/${c.course_id}`} className="course-card">
            <span className="course-title">{c.title}</span>
            {c.teacher_name && <span className="course-teacher">{c.teacher_name}</span>}
            <span className="course-lessons">{c.lessons} {t("dashboard.lessons", "lessons")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { BookingDTO } from "../../../types/api";

export interface MyTutorsWidgetProps {
  bookings: BookingDTO[];
}

export function MyTutorsWidget({ bookings }: MyTutorsWidgetProps): JSX.Element | null {
  const { t } = useTranslation();
  const myTutors = useMemo(() => {
    const acc: Record<string, { id: string | number; name: string; lessons: number }> = {};
    for (const b of bookings) {
      const tid = b.teacher_id;
      const tname = b.teacher_name as string | undefined;
      if (!tid || !tname) continue;
      if (!acc[String(tid)]) acc[String(tid)] = { id: tid, name: tname, lessons: 0 };
      acc[String(tid)].lessons += 1;
    }
    return Object.values(acc);
  }, [bookings]);

  if (myTutors.length === 0) return null;

  return (
    <section className="dashboard-section">
      <h3>{t("dashboard.my_tutors", "My tutors")}</h3>
      <div className="tutors-list">
        {myTutors.map((tutor) => (
          <Link key={String(tutor.id)} to={`/tutor/${tutor.id}`} className="tutor-card">
            <span className="tutor-name">{tutor.name}</span>
            <span className="tutor-lessons">{tutor.lessons} {t("dashboard.lessons", "lessons")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

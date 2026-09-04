// migrated to TSX — minimal strict types (controlled)
import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Lesson.css";

const LessonRoom = lazy(() => import("../components/lesson/LessonRoom"));

export default function PgLesson() {
  const { bookingId } = useParams();
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="lesson-page">
          <div className="lesson-error">
            <p>{t("lesson.connecting", "Connecting...")}</p>
          </div>
        </div>
      }
    >
      <LessonRoom bookingId={bookingId} />
    </Suspense>
  );
}

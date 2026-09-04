import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NextLessonCard } from "../../../components/schedule";
import { useNextLesson } from "../../../hooks/schedule/useScheduleQueries";
import { Spinner, ErrorState, EmptyState } from "../../../components/ui/Primitives";

export function NextLessonWidget(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: lesson, isLoading, error, refetch } = useNextLesson();

  if (isLoading) return <Spinner label={t("common.loading", "Loading...") as string} />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />;
  if (!lesson) return <EmptyState title={t("schedule.next_lesson_empty_title", "Нет ближайших занятий") as string} />;

  return (
    <NextLessonCard
      lesson={lesson}
      onJoin={(id) => navigate(`/lesson/${id}`)}
      onViewDetails={(l) => navigate(`/lesson/${l.id}`)}
    />
  );
}

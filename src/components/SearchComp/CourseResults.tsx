// migrated to TSX — minimal strict types (controlled)
import { useTranslation } from "react-i18next";
import CardCourse from "../CardCourse";
import Pagination from "../ui/Pagination";
import { Spinner, ErrorState, EmptyState } from "../ui/Primitives";

export default function CourseResults({ courses, loading, error, totalPages, page, onPageChange, resultCount, hasActiveFilters, onResetFilters }: Record<string, unknown>) {
  const { t } = useTranslation();

  return (
    <div className="card-courses-content">
      {!loading && courses.length > 0 && (
        <div className="search-results-header">
          <h3>{t("search.all_tutor_list")}</h3>
          <span className="search-result-count">
            {t("search.results_count", "{{count}} results").replace("{{count}}", resultCount)}
          </span>
        </div>
      )}
      {!loading && courses.length === 0 && (
        <h3>{t("search.all_tutor_list")}</h3>
      )}
      {loading && <Spinner label={t("search.loading", "Loading...")} />}
      {!loading && error && (
        <ErrorState message={error} onRetry={onPageChange ? () => onPageChange(page) : undefined} />
      )}
      {!loading && !error && courses.length === 0 && (
        <EmptyState
          icon="🔍"
          title={t("search.no_courses", "No courses found")}
          hint={
            hasActiveFilters
              ? <button type="button" className="btn-secondary" onClick={onResetFilters}>{t("search.reset_all", "Reset all")}</button>
              : t("search.no_courses_hint", "Try adjusting your filters or search query.")
          }
        />
      )}
      <div className="courses-search-grid">
        {!loading && courses.map((course) => (
          <CardCourse key={course.id} course={course} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  );
}

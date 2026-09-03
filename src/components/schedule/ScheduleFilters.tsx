import { memo, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ScheduleFilters, CourseOption, LessonStatus } from "../../types/schedule";
import "./ScheduleFilters.css";

interface ScheduleFiltersProps {
  filters: ScheduleFilters;
  onChange: (filters: ScheduleFilters) => void;
  courses: CourseOption[];
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: LessonStatus; labelKey: string }[] = [
  { value: "SCHEDULED", labelKey: "statuses.scheduled" },
  { value: "IN_PROGRESS", labelKey: "statuses.in_progress" },
  { value: "PENDING_CONFIRMATION", labelKey: "statuses.pending_confirmation" },
  { value: "SCHEDULE_NEGOTIATION", labelKey: "statuses.schedule_negotiation" },
  { value: "COMPLETED", labelKey: "statuses.completed" },
  { value: "CANCELLED", labelKey: "statuses.cancelled" },
  { value: "RESCHEDULED", labelKey: "statuses.rescheduled" },
  { value: "APPLICATION", labelKey: "statuses.application" },
];

export const ScheduleFilters = memo(function ScheduleFilters({
  filters,
  onChange,
  courses,
  disabled = false,
}: ScheduleFiltersProps) {
  const { t } = useTranslation();
  const [courseOpen, setCourseOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const courseRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseRef.current && !courseRef.current.contains(event.target as Node)) {
        setCourseOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCourse = () => !disabled && setCourseOpen((prev) => !prev);
  const toggleStatus = () => !disabled && setStatusOpen((prev) => !prev);

  const handleCourseChange = (courseId: string) => {
    const newCourses = filters.courseIds.includes(courseId)
      ? filters.courseIds.filter((id) => id !== courseId)
      : [...filters.courseIds, courseId];
    onChange({ ...filters, courseIds: newCourses });
  };

  const handleStatusChange = (status: LessonStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: newStatuses });
  };

  const clearAll = () => onChange({ courseIds: [], statuses: [] });

  const hasActiveFilters = filters.courseIds.length > 0 || filters.statuses.length > 0;

  return (
    <div className="schedule-filters" role="toolbar" aria-label={t("schedule.filters", "Фильтры")}>
      {/* Courses Multiselect */}
      <div className="filter-group" ref={courseRef}>
        <button
          type="button"
          className={`filter-trigger ${courseOpen ? "open" : ""}`}
          onClick={toggleCourse}
          disabled={disabled}
          aria-expanded={courseOpen}
          aria-haspopup="listbox"
          aria-label={t("schedule.filter_courses", "Фильтр по курсам")}
        >
          <span className="filter-trigger-label">
            {filters.courseIds.length === 0
              ? t("schedule.all_courses", "Все курсы")
              : courses.find((c) => c.id === filters.courseIds[0])?.title || `${filters.courseIds.length} ${t("plural.course_selected", "курсов")}`}
          </span>
          {filters.courseIds.length > 1 && (
            <span className="filter-count">+{filters.courseIds.length - 1}</span>
          )}
          <span className="filter-chevron" aria-hidden="true">▼</span>
        </button>

        {courseOpen && (
          <div className="filter-dropdown" role="listbox" aria-label={t("schedule.filter_courses", "Фильтр по курсам")}>
            {courses.length === 0 ? (
              <div className="filter-empty">{t("schedule.no_courses", "Курсов нет")}</div>
            ) : (
              courses.map((course) => (
                <label key={course.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.courseIds.includes(course.id)}
                    onChange={() => handleCourseChange(course.id)}
                    disabled={disabled}
                  />
                  <span>{course.title}</span>
                  {course.tutorName && <span className="filter-option-tutor">{course.tutorName}</span>}
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Status Multiselect */}
      <div className="filter-group" ref={statusRef}>
        <button
          type="button"
          className={`filter-trigger ${statusOpen ? "open" : ""}`}
          onClick={toggleStatus}
          disabled={disabled}
          aria-expanded={statusOpen}
          aria-haspopup="listbox"
          aria-label={t("schedule.filter_status", "Фильтр по статусу")}
        >
          <span className="filter-trigger-label">
            {filters.statuses.length === 0
              ? t("schedule.all_statuses", "Все статусы")
              : filters.statuses.length === 1
              ? t(STATUS_OPTIONS.find((s) => s.value === filters.statuses[0])?.labelKey || filters.statuses[0])
              : `${filters.statuses.length} ${t("plural.status_selected", "статусов")}`}
          </span>
          {filters.statuses.length > 1 && (
            <span className="filter-count">+{filters.statuses.length - 1}</span>
          )}
          <span className="filter-chevron" aria-hidden="true">▼</span>
        </button>

        {statusOpen && (
          <div className="filter-dropdown" role="listbox" aria-label={t("schedule.filter_status", "Фильтр по статусу")}>
            {STATUS_OPTIONS.map((status) => (
              <label key={status.value} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(status.value)}
                  onChange={() => handleStatusChange(status.value)}
                  disabled={disabled}
                />
                <span className="filter-option-status">
                  <span
                    className={`status-dot status-${status.value.toLowerCase().replace("_", "-")}`}
                    aria-hidden="true"
                  />
                  {t(status.labelKey, status.value)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          type="button"
          className="filter-clear"
          onClick={clearAll}
          disabled={disabled}
          aria-label={t("schedule.clear_filters", "Сбросить фильтры")}
        >
          {t("schedule.clear", "Сбросить")}
        </button>
      )}
    </div>
  );
});

ScheduleFilters.displayName = "ScheduleFilters";
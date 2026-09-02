import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../store/authStore";
import { usePageTitle } from "../../components/pageTitleContext";
import { isTutorLike } from "../../constants/enums";
import { startOfWeek, addDays, addMonths, isSameDay, toLocalInput } from "../../utils/calendar";
import { getUserTimezone } from "../../utils/timezone";
import {
  NextLessonCard,
  ActionRequiredBlock,
  ScheduleViewSwitcher,
  ScheduleFilters,
  DayView,
  WeekView,
  MonthView,
  LessonDetailsModal,
  ScheduleSkeleton,
} from "../../components/schedule";
import {
  useNextLesson,
  useScheduleActions,
  useScheduleDay,
  useScheduleWeek,
  useScheduleMonth,
  useCoursesForFilter,
} from "../../hooks/schedule";
import type { ScheduleView, LessonDTO, ScheduleFilters as ScheduleFiltersType } from "../../types/schedule";
import "./SchedulePage.css";

export default function SchedulePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setPageTitle = usePageTitle();
  const [searchParams, setSearchParams] = useSearchParams();
  const tutorMode = isTutorLike(user);
  const locale = i18n.language || "ru";
  const userTimezone = getUserTimezone();

  // URL-synced state
  const urlView = (searchParams.get("view") as ScheduleView) || "week";
  const urlDate = searchParams.get("date") || toLocalInput(new Date());

  const [view, setView] = useState<ScheduleView>(urlView);
  const [selectedDate, setSelectedDate] = useState(urlDate);
  const [selectedLesson, setSelectedLesson] = useState<LessonDTO | null>(null);
  const [filters, setFilters] = useState<ScheduleFiltersType>({
    courseIds: [],
    statuses: [],
  });

  // Sync URL with state
  useEffect(() => {
    if (view !== urlView) setView(urlView);
  }, [urlView]);

  useEffect(() => {
    if (selectedDate !== urlDate) setSelectedDate(urlDate);
  }, [urlDate]);

  const updateURL = useCallback(
    (newView?: ScheduleView, newDate?: string) => {
      const params = new URLSearchParams(searchParams);
      if (newView) params.set("view", newView);
      if (newDate) params.set("date", newDate);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleViewChange = useCallback(
    (newView: ScheduleView) => {
      setView(newView);
      updateURL(newView);
    },
    [updateURL]
  );

  const handleDateChange = useCallback(
    (newDate: string) => {
      setSelectedDate(newDate);
      updateURL(undefined, newDate);
    },
    [updateURL]
  );

  const handleLessonClick = useCallback((lesson: LessonDTO) => {
    setSelectedLesson(lesson);
  }, []);

  const handleJoinLesson = useCallback((lesson: LessonDTO) => {
    navigate(`/lesson/${lesson.id}`);
  }, [navigate]);

  const handleActionClick = useCallback(async (action: any, scheduleAction: any) => {
    // Handle action clicks (accept/reject proposals, etc.)
    // This would call the appropriate mutation
    console.log("Action clicked:", action, scheduleAction);
  }, []);

  const handleFilterChange = useCallback((newFilters: ScheduleFiltersType) => {
    setFilters(newFilters);
  }, []);

  // Page title
  useEffect(() => {
    setPageTitle(t("navbar.schedule", "Расписание"));
  }, [setPageTitle, t]);

  // Compute date ranges for each view
  const dateRange = useMemo(() => {
    const date = new Date(selectedDate + "T00:00:00");
    if (view === "month") {
      const from = new Date(date.getFullYear(), date.getMonth(), 1);
      const to = addMonths(from, 1);
      return { from, to };
    }
    if (view === "week") {
      const from = startOfWeek(date);
      return { from, to: addDays(from, 7) };
    }
    return { from: date, to: addDays(date, 1) };
  }, [view, selectedDate]);

  // Queries
  const nextLessonQuery = useNextLesson();
  const actionsQuery = useScheduleActions();
  const dayQuery = useScheduleDay(view === "day" ? selectedDate : "");
  const weekQuery = useScheduleWeek(view === "week" ? selectedDate : "");
  const monthQuery = useScheduleMonth(view === "month" ? dateRange.from.getFullYear() : 0, view === "month" ? dateRange.from.getMonth() + 1 : 0);
  const coursesQuery = useCoursesForFilter();

  // Navigation helpers
  const goPrev = useCallback(() => {
    const date = new Date(selectedDate + "T00:00:00");
    if (view === "month") handleDateChange(toLocalInput(addMonths(date, -1)));
    else if (view === "week") handleDateChange(toLocalInput(addDays(date, -7)));
    else handleDateChange(toLocalInput(addDays(date, -1)));
  }, [view, selectedDate, handleDateChange]);

  const goNext = useCallback(() => {
    const date = new Date(selectedDate + "T00:00:00");
    if (view === "month") handleDateChange(toLocalInput(addMonths(date, 1)));
    else if (view === "week") handleDateChange(toLocalInput(addDays(date, 7)));
    else handleDateChange(toLocalInput(addDays(date, 1)));
  }, [view, selectedDate, handleDateChange]);

  const goToday = useCallback(() => {
    handleDateChange(toLocalInput(new Date()));
  }, [handleDateChange]);

  const loading = nextLessonQuery.isLoading || actionsQuery.isLoading ||
    (view === "day" && dayQuery.isLoading) ||
    (view === "week" && weekQuery.isLoading) ||
    (view === "month" && monthQuery.isLoading);

  const error = nextLessonQuery.error || actionsQuery.error ||
    dayQuery.error || weekQuery.error || monthQuery.error;

  return (
    <div className="schedule-page">
      <header className="schedule-page-header">
        <h1 className="schedule-page-title">{t("navbar.schedule", "Расписание")}</h1>
        <div className="schedule-page-header-actions">
          <ScheduleViewSwitcher view={view} onChange={handleViewChange} />
        </div>
      </header>

      <nav className="schedule-navigation" aria-label={t("schedule.navigation", "Навигация")}>
        <button type="button" className="schedule-nav-btn" onClick={goPrev} aria-label={t("schedule.prev", "Предыдущий")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button type="button" className="schedule-nav-btn" onClick={goNext} aria-label={t("schedule.next", "Следующий")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button type="button" className="btn-secondary schedule-today-btn" onClick={goToday}>
          {t("schedule.today", "Сегодня")}
        </button>
      </nav>

      {loading ? (
        <ScheduleSkeleton compact={view === "month"} />
      ) : error ? (
        <div className="schedule-error" role="alert">
          <p>{t("schedule.load_error", "Не удалось загрузить расписание")}</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            {t("common.retry", "Повторить")}
          </button>
        </div>
      ) : (
        <>
          {/* NEXT LESSON */}
          <NextLessonCard
            lesson={nextLessonQuery.data || null}
            onJoin={handleJoinLesson}
            onViewDetails={handleLessonClick}
          />

          {/* ACTION REQUIRED */}
          <ActionRequiredBlock
            actions={actionsQuery.data || []}
            onActionClick={handleActionClick}
          />

          {/* FILTERS */}
          <ScheduleFilters
            filters={filters}
            onChange={handleFilterChange}
            courses={coursesQuery.data || []}
            disabled={coursesQuery.isLoading}
          />

          {/* CALENDAR VIEW */}
          {view === "day" && (
            <DayView
              date={selectedDate}
              data={dayQuery.data}
              loading={dayQuery.isLoading}
              error={dayQuery.error as Error | null}
              onLessonClick={handleLessonClick}
              onJoinLesson={handleJoinLesson}
              locale={locale}
            />
          )}

          {view === "week" && (
            <WeekView
              weekStart={selectedDate}
              data={weekQuery.data}
              loading={weekQuery.isLoading}
              error={weekQuery.error as Error | null}
              selectedDate={selectedDate}
              onLessonClick={handleLessonClick}
              onJoinLesson={handleJoinLesson}
              onDateSelect={handleDateChange}
              locale={locale}
            />
          )}

          {view === "month" && (
            <MonthView
              year={dateRange.from.getFullYear()}
              month={dateRange.from.getMonth() + 1}
              data={monthQuery.data}
              loading={monthQuery.isLoading}
              error={monthQuery.error as Error | null}
              selectedDate={selectedDate}
              onLessonClick={handleLessonClick}
              onJoinLesson={handleJoinLesson}
              onDateSelect={handleDateChange}
              locale={locale}
            />
          )}
        </>
      )}

      {/* LESSON DETAILS MODAL */}
      <LessonDetailsModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onChanged={() => {
          nextLessonQuery.refetch();
          actionsQuery.refetch();
          dayQuery.refetch();
          weekQuery.refetch();
          monthQuery.refetch();
        }}
      />
    </div>
  );
}
import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../components/pageTitleContext";
import { startOfWeek, addDays, addMonths, toLocalInput } from "../../utils/calendar";
import {
  NextLessonCard,
  ActionRequiredBlock,
  ScheduleViewSwitcher,
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
} from "../../hooks/schedule";
import type { ScheduleView, LessonDTO } from "../../types/schedule";
import "./SchedulePage.css";

export default function SchedulePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setPageTitle = usePageTitle();
  const [searchParams, setSearchParams] = useSearchParams();
  const locale = i18n.language || "ru";

  // URL-synced state — mobile-first: on <768 default to DayView
  const getDefaultView = (): ScheduleView => {
    const param = searchParams.get("view") as ScheduleView | null;
    if (param === "day" || param === "week" || param === "month") return param;
    if (typeof window !== "undefined" && window.innerWidth < 768) return "day";
    return "week";
  };
  const urlView = (searchParams.get("view") as ScheduleView) || getDefaultView();
  const urlDate = searchParams.get("date") || toLocalInput(new Date());

  const [view, setView] = useState<ScheduleView>(urlView);
  const [selectedDate, setSelectedDate] = useState(urlDate);
  const [selectedLesson, setSelectedLesson] = useState<LessonDTO | null>(null);

  // Sync URL with state
  useEffect(() => {
    if (view !== urlView) setView(urlView);
  }, [view, urlView]);

  // Auto-switch to DayView on first mobile load if no explicit view param
  useEffect(() => {
    if (!searchParams.get("view") && typeof window !== "undefined" && window.innerWidth < 768 && view === "week") {
      setView("day");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDate !== urlDate) setSelectedDate(urlDate);
  }, [urlDate, selectedDate]);

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

  const handleActionClick = useCallback(async (_action: unknown, _scheduleAction: unknown) => {
    // TODO: wire to schedule mutations when needed
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

  // Queries — week uses Monday as start for consistent display
  const weekStartStr = useMemo(() => {
    if (view !== "week" || !selectedDate) return "";
    try { return toLocalInput(startOfWeek(new Date(selectedDate + "T00:00:00"))); } catch { return selectedDate; }
  }, [view, selectedDate]);
  const nextLessonQuery = useNextLesson();
  const actionsQuery = useScheduleActions();
  const dayQuery = useScheduleDay(view === "day" ? selectedDate : "");
  const weekQuery = useScheduleWeek(weekStartStr);
  const monthQuery = useScheduleMonth(view === "month" ? dateRange.from.getFullYear() : 0, view === "month" ? dateRange.from.getMonth() + 1 : 0);

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

  // Показываем скелет только для активных вьюх, ошибку — только для текущего view
  const viewError = view === "day" ? dayQuery.error : view === "week" ? weekQuery.error : monthQuery.error;

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

      {nextLessonQuery.isLoading || actionsQuery.isLoading ? (
        <ScheduleSkeleton compact={view === "month"} />
      ) : (
        <>
          {/* NEXT LESSON — показываем даже если календарь упал */}
          {nextLessonQuery.error ? (
            <div className="schedule-error" role="alert"><p>{t("schedule.load_error", "Не удалось загрузить расписание")}: {(nextLessonQuery.error as Error).message}</p></div>
          ) : (
            <NextLessonCard lesson={nextLessonQuery.data || null} onJoin={handleJoinLesson} onViewDetails={handleLessonClick} />
          )}
          {actionsQuery.error ? null : (
            <ActionRequiredBlock actions={actionsQuery.data || []} onActionClick={handleActionClick} />
          )}
          {viewError ? (
            <div className="schedule-error" role="alert">
              <p>{t("schedule.load_error", "Не удалось загрузить расписание")}: {(viewError as Error).message}</p>
              <button type="button" className="btn-primary" onClick={() => { if (view === "day") dayQuery.refetch(); if (view === "week") weekQuery.refetch(); if (view === "month") monthQuery.refetch(); }}>
                {t("common.retry", "Повторить")}
              </button>
            </div>
          ) : view === "day" ? (
            <DayView date={selectedDate} data={dayQuery.data} loading={dayQuery.isLoading} error={dayQuery.error as Error | null} onLessonClick={handleLessonClick} onJoinLesson={handleJoinLesson} locale={locale} />
          ) : view === "week" ? (
            <WeekView weekStart={weekStartStr} data={weekQuery.data} loading={weekQuery.isLoading} error={weekQuery.error as Error | null} selectedDate={selectedDate} onLessonClick={handleLessonClick} onJoinLesson={handleJoinLesson} onDateSelect={handleDateChange} locale={locale} />
          ) : (
            <MonthView year={dateRange.from.getFullYear()} month={dateRange.from.getMonth() + 1} data={monthQuery.data} loading={monthQuery.isLoading} error={monthQuery.error as Error | null} selectedDate={selectedDate} onLessonClick={handleLessonClick} onJoinLesson={handleJoinLesson} onDateSelect={handleDateChange} locale={locale} />
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
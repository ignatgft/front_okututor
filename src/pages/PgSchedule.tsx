// migrated to TSX — minimal strict types (controlled)
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { useCalendar } from "../hooks/useCalendar";
import { useToast } from "../components/ui/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";
import { ErrorState, Badge } from "../components/ui/Primitives";
import { isTutorLike } from "../constants/enums";
import { usePageTitle } from "../components/pageTitleContext";
import { toLocalInput, buildCalendarDay, compareByCalendarDay } from "../utils/date";
import { addDays, addMonths, startOfWeek, eventDaysKey } from "../utils/calendar";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarMonth from "../components/calendar/CalendarMonth";
import CalendarWeek from "../components/calendar/CalendarWeek";
import CalendarDay from "../components/calendar/CalendarDay";
import CalendarFilters from "../components/calendar/CalendarFilters";
import CalendarSkeleton from "../components/calendar/CalendarSkeleton";
import CalendarEmptyState from "../components/calendar/CalendarEmptyState";
import CalendarEventModal from "../components/calendar/CalendarEventModal";
import AvailabilityEditor from "../components/calendar/AvailabilityEditor";
import "../styles/Schedule.css";
import "../styles/Calendar.css";

export default function PgSchedule() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const setPageTitle = usePageTitle();
  const tutorMode = isTutorLike(user);
  const locale = i18n.language || "ru";

  useEffect(() => { setPageTitle(t("navbar.schedule", "Schedule")); }, [setPageTitle, t]);

  const [slotToRemove, setSlotToRemove] = useState(null);

  const range = useMemo(() => {
    if (view === "month") {
      const from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const to = addMonths(from, 1);
      return { from, to };
    }
    if (view === "week") {
      const from = startOfWeek(selectedDate);
      return { from, to: addDays(from, 7) };
    }
    return { from: selectedDate, to: addDays(selectedDate, 1) };
  }, [view, selectedDate]);

  const {
    events,
    loading,
    error,
    refetch,
    availability,
    availabilityError,
    reloadAvailability,
    addSlot,
    removeSlot,
  } = useCalendar({
    from: range.from,
    to: range.to,
    tutorMode,
    includeAvailability: tutorMode,
  });

  const hasAnyEvents = events.length > 0;

  const filteredEvents = useMemo(
    () => (statusFilter === "ALL" ? events : events.filter((evt) => evt.status === statusFilter)),
    [events, statusFilter]
  );

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const evt of filteredEvents) {
      const start = evt.start_at ? new Date(evt.start_at) : null;
      if (!start) continue;
      const key = eventDaysKey(start);
      (map[key] || (map[key] = [])).push(evt);
    }
    return map;
  }, [filteredEvents]);

  const dayEvents = useMemo(
    () => filteredEvents.filter((evt) => compareByCalendarDay(evt.start_at, selectedDate)),
    [filteredEvents, selectedDate]
  );

  const confirmRemoveSlot = async () => {
    if (!slotToRemove) return;
    try {
      await removeSlot(slotToRemove.id);
      setSlotToRemove(null);
      toast.success(t("schedule.slot_removed", "Slot removed"));
    } catch (err) {
      toast.error(err.message || t("errors.default", "Something went wrong"));
    }
  };

  const goPrev = () => {
    if (view === "month") setSelectedDate(addMonths(selectedDate, -1));
    else if (view === "week") setSelectedDate(addDays(selectedDate, -7));
    else setSelectedDate(addDays(selectedDate, -1));
  };

  const goNext = () => {
    if (view === "month") setSelectedDate(addMonths(selectedDate, 1));
    else if (view === "week") setSelectedDate(addDays(selectedDate, 7));
    else setSelectedDate(addDays(selectedDate, 1));
  };

  const goToday = () => setSelectedDate(new Date());

  const openDay = useCallback((day) => { setSelectedDate(day); }, []);

  const joinLesson = (bookingId) => navigate(`/lesson/${bookingId}`);

  return (
    <>
      <div className="schedule-page">
        <CalendarHeader
          view={view}
          onChangeView={setView}
          month={selectedDate}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          onPickDate={(iso) => iso && setSelectedDate(buildCalendarDay(iso))}
          dateValue={toLocalInput(selectedDate)}
          locale={locale}
        />

        {loading ? (
          <CalendarSkeleton compact={view === "month"} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <CalendarFilters value={statusFilter} onChange={setStatusFilter} />
            {view === "month" && (
              <CalendarMonth
                month={selectedDate}
                eventsByDay={eventsByDay}
                selectedDay={selectedDate}
                onSelectDay={openDay}
                locale={locale}
              />
            )}
            {view === "week" && (
              <CalendarWeek
                weekStart={selectedDate}
                eventsByDay={eventsByDay}
                onSelectEvent={setSelectedEvent}
                onSelectDay={openDay}
                locale={locale}
              />
            )}
            {view === "day" && (
              <CalendarDay
                day={selectedDate}
                events={dayEvents}
                onSelectEvent={setSelectedEvent}
                onJoin={joinLesson}
                locale={locale}
              />
            )}

            <DayEventList
              events={dayEvents}
              tutorMode={tutorMode}
              hasAnyEvents={hasAnyEvents}
              onOpen={setSelectedEvent}
            />

            {tutorMode && (
              <AvailabilityEditor
                availability={availability}
                error={availabilityError}
                onAdd={addSlot}
                onRequestRemove={setSlotToRemove}
                onRetry={reloadAvailability}
              />
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!slotToRemove}
        title={t("schedule.delete_slot_title", "Remove slot?")}
        message={t("schedule.delete_slot_message", "Students will no longer see this time as available.")}
        confirmLabel={t("common.delete", "Delete")}
        onCancel={() => setSlotToRemove(null)}
        onConfirm={confirmRemoveSlot}
      />

      <CalendarEventModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        tutorMode={tutorMode}
        onClose={() => setSelectedEvent(null)}
        onChanged={refetch}
      />
    </>
  );
}

function DayEventList({ events, tutorMode, hasAnyEvents, onOpen }) {
  const { t } = useTranslation();
  const sorted = useMemo(() => events.slice().sort((a, b) => new Date(a.start_at) - new Date(b.start_at)), [events]);
  if (sorted.length === 0)
    return <CalendarEmptyState hasAnyEvents={hasAnyEvents} />;
  return (
    <div className="schedule-events-list" aria-label={t("schedule.events_on_day", "Lessons")}>
      {sorted.map((b) => {
        const start = new Date(b.start_at);
        return (
          <button key={b.id} type="button" className="schedule-event schedule-event-clickable" onClick={() => onOpen(b)}>
            <div className="event-time">
              <span>{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="event-duration">
                {Math.round((new Date(b.end_at) - start) / 60000)} {t("schedule.minutes_short", "min")}
              </span>
            </div>
            <div className="event-info">
              <h4>{b.course_title}</h4>
              <p>{tutorMode ? b.student_name : b.teacher_name}</p>
            </div>
            <Badge status={b.status}>{t(`statuses.${b.status}`, b.status)}</Badge>
          </button>
        );
      })}
    </div>
  );
}

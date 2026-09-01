import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { bookingApi } from "./booking.api";
import { BOOKING_STATUS } from "../constants/enums";
import { getUserTimezone } from "../utils/timezone";

export const calendarApi = {
  range(from, to, tz = getUserTimezone()) {
    return apiClient.get(endpoints.calendar.range(from, to, tz));
  },
};

function isBookingLike(item) {
  return item && typeof item.start_at === "string";
}

function normalizeBooking(b) {
  return {
    id: b.id,
    course_id: b.course_id,
    course_title: b.course_title || b.course?.title,
    teacher_name: b.teacher_name || b.tutor_name || b.teacher?.full_name,
    student_name: b.student_name || b.student?.full_name,
    start_at: b.start_at,
    end_at: b.end_at,
    status: b.status,
    meeting_url: b.meeting_url,
    location: b.location,
  };
}

export function normalizeCalendarEvents(data) {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.lessons)
        ? data.lessons
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.result)
            ? data.result
            : [];
  return arr.map((item) => (isBookingLike(item) ? normalizeBooking(item) : item));
}

export function isJoinable(evt, now = Date.now()) {
  if (!evt?.status || evt.status !== BOOKING_STATUS.CONFIRMED) return false;
  const start = new Date(evt.start_at).getTime();
  return start - now < 15 * 60 * 1000 && start > now - 30 * 60 * 1000;
}

export async function loadCalendarRange(fromStr, toStr, opts = {}) {
  const { fallbackToBookings = true, tutorMode = false } = opts;
  const { response, data } = await calendarApi.range(fromStr, toStr);
  if (response.ok) {
    const events = normalizeCalendarEvents(data);
    if (events.length > 0) return events;
  }
  if (!fallbackToBookings) return [];

  const { response: bRes, data: bData } = await (tutorMode ? bookingApi.teacher() : bookingApi.my());
  if (!bRes.ok) throw new Error(bData?.error || bData?.message || "");
  const rows = Array.isArray(bData)
    ? bData
    : Array.isArray(bData?.content)
      ? bData.content
      : Array.isArray(bData?.lessons)
        ? bData.lessons
        : Array.isArray(bData?.items)
          ? bData.items
          : [];
  return rows.map(normalizeBooking);
}

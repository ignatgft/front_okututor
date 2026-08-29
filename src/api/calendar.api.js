import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { bookingApi } from "./booking.api";
import { BOOKING_STATUS } from "../constants/enums";

export const calendarApi = {
  range(from, to) {
    return apiClient.get(endpoints.calendar.range(from, to));
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
  if (Array.isArray(data)) {
    return data.map((item) => (isBookingLike(item) ? normalizeBooking(item) : item));
  }
  return [];
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
    const events = normalizeCalendarEvents(data.content ?? data);
    if (events.length > 0) return events;
  }
  if (!fallbackToBookings) return [];

  const { response: bRes, data: bData } = await (tutorMode ? bookingApi.teacher() : bookingApi.my());
  if (!bRes.ok) throw new Error(bData?.error || bData?.message || "");
  const rows = Array.isArray(bData) ? bData : bData.content || [];
  return rows.map(normalizeBooking);
}

import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { bookingApi } from "./booking.api";
import { BOOKING_STATUS } from "../constants/enums";
import { Booking } from "../types/booking";
import { MaybePaginated, toList } from "../types/api";

export const calendarApi = {
  range(from: string, to: string) {
    return apiClient.get(endpoints.calendar.range(from, to));
  },
};

function isBookingLike(item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === "object" && typeof (item as Record<string, unknown>).start_at === "string";
}

function normalizeBooking(b: Record<string, unknown>): Booking {
  return {
    id: b.id as string | number,
    course_id: b.course_id as string | number | undefined,
    course_title: (b.course_title as string) || (b.course as { title?: string } | undefined)?.title,
    teacher_name: (b.teacher_name as string) || (b.tutor_name as string) || (b.teacher as { full_name?: string } | undefined)?.full_name,
    student_name: (b.student_name as string) || (b.student as { full_name?: string } | undefined)?.full_name,
    start_at: b.start_at as string,
    end_at: (b.end_at as string) || (b.end_at as string | undefined),
    status: b.status as string,
    meeting_url: (b.meeting_url as string) || null,
    location: (b.location as string) || null,
  };
}

export function normalizeCalendarEvents(data: unknown): Booking[] {
  if (Array.isArray(data)) {
    return data
      .filter(isBookingLike)
      .map((item) => normalizeBooking(item as Record<string, unknown>));
  }
  return [];
}

export function isJoinable(evt: Booking | null | undefined, now: number = Date.now()): boolean {
  if (!evt?.status || evt.status !== BOOKING_STATUS.CONFIRMED) return false;
  const start = new Date(evt.start_at).getTime();
  return start - now < 15 * 60 * 1000 && start > now - 30 * 60 * 1000;
}

export async function loadCalendarRange(
  fromStr: string,
  toStr: string,
  opts: { fallbackToBookings?: boolean; tutorMode?: boolean } = {}
): Promise<Booking[]> {
  const { fallbackToBookings = true, tutorMode = false } = opts;
  const { response, data } = await calendarApi.range(fromStr, toStr);
  if (response.ok) {
    const events = normalizeCalendarEvents(data);
    if (events.length > 0) return events;
  }
  if (!fallbackToBookings) return [];

  const { response: bRes, data: bData } = await (tutorMode ? bookingApi.teacher() : bookingApi.my());
  if (!bRes.ok) {
    const msg =
      (bData as { error?: string; message?: string } | null)?.error ||
      (bData as { message?: string } | null)?.message ||
      "";
    throw new Error(msg || "Failed to load bookings");
  }
  return toList<Booking>(bData as MaybePaginated<Booking>);
}
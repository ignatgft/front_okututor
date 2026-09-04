import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { bookingApi } from "./booking.api";
import { BOOKING_STATUS } from "../constants/enums";
import { getUserTimezone } from "../utils/timezone";
import type { HttpResult } from "./client/responseParser";
import type { BookingDTO } from "../types/api";

export const calendarApi = {
  range(from: string, to: string, tz: string = getUserTimezone()): Promise<HttpResult<unknown>> {
    return apiClient.get(endpoints.calendar.range(from, to, tz));
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBookingLike(item: unknown): boolean {
  return isRecord(item) && typeof item["start_at"] === "string";
}

function normalizeBooking(b: Record<string, unknown>): BookingDTO {
  const course = b["course"] as Record<string, unknown> | undefined;
  const teacher = b["teacher"] as Record<string, unknown> | undefined;
  const student = b["student"] as Record<string, unknown> | undefined;
  return {
    id: b["id"] as string | number,
    course_id: b["course_id"] as string | number | undefined,
    course_title: (b["course_title"] as string | undefined) ?? (course?.["title"] as string | undefined),
    teacher_name:
      (b["teacher_name"] as string | undefined) ??
      (b["tutor_name"] as string | undefined) ??
      (teacher?.["full_name"] as string | undefined),
    student_name: (b["student_name"] as string | undefined) ?? (student?.["full_name"] as string | undefined),
    start_at: b["start_at"] as string,
    end_at: b["end_at"] as string | undefined,
    status: b["status"] as string,
    meeting_url: (b["meeting_url"] as string | null | undefined) ?? null,
    location: (b["location"] as string | null | undefined) ?? null,
  };
}

export function normalizeCalendarEvents(data: unknown): BookingDTO[] {
  const arr: unknown[] = Array.isArray(data)
    ? (data as unknown[])
    : isRecord(data) && Array.isArray(data["content"])
      ? (data["content"] as unknown[])
      : isRecord(data) && Array.isArray(data["lessons"])
        ? (data["lessons"] as unknown[])
        : isRecord(data) && Array.isArray(data["items"])
          ? (data["items"] as unknown[])
          : isRecord(data) && Array.isArray(data["result"])
            ? (data["result"] as unknown[])
            : [];
  return arr.filter(isBookingLike).map((item) => normalizeBooking(item as Record<string, unknown>));
}

export function isJoinable(evt: BookingDTO | null | undefined, now: number = Date.now()): boolean {
  if (!evt?.status || evt.status !== BOOKING_STATUS.CONFIRMED) return false;
  const start = new Date(evt.start_at).getTime();
  return start - now < 10 * 60 * 1000 && start > now - 30 * 60 * 1000;
}

export async function loadCalendarRange(
  fromStr: string,
  toStr: string,
  opts: { fallbackToBookings?: boolean; tutorMode?: boolean } = {}
): Promise<BookingDTO[]> {
  const { fallbackToBookings = true, tutorMode = false } = opts;
  const { response, data } = await calendarApi.range(fromStr, toStr);
  if (response.ok) {
    const events = normalizeCalendarEvents(data);
    if (events.length > 0) return events;
  }
  if (!fallbackToBookings) return [];

  const { response: bRes, data: bData } = await (tutorMode ? bookingApi.teacher() : bookingApi.my());
  if (!bRes.ok) {
    const rec = isRecord(bData) ? (bData as Record<string, unknown>) : null;
    const msg = (rec?.["error"] as string | undefined) ?? (rec?.["message"] as string | undefined) ?? "";
    throw new Error(msg);
  }
  const rows: unknown[] = Array.isArray(bData)
    ? (bData as unknown[])
    : isRecord(bData) && Array.isArray(bData["content"])
      ? (bData["content"] as unknown[])
      : isRecord(bData) && Array.isArray(bData["lessons"])
        ? (bData["lessons"] as unknown[])
        : isRecord(bData) && Array.isArray(bData["items"])
          ? (bData["items"] as unknown[])
          : [];
  return rows.filter(isBookingLike).map((r) => normalizeBooking(r as Record<string, unknown>));
}

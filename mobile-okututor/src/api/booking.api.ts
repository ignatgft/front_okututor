import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";
import { Booking, CreateBookingPayload, Enrollment } from "../types/booking";
import { MaybePaginated } from "../types/api";

export const bookingApi = {
  byId: (id: string | number): ApiResult<Booking> => apiClient.get(endpoints.bookings.byId(id)),

  create: (payload: CreateBookingPayload): ApiResult<Booking> =>
    apiClient.post(endpoints.bookings.create, payload),

  confirm: (id: string | number): ApiResult<Booking> =>
    apiClient.post(endpoints.bookings.confirm(id)),

  reject: (id: string | number, reason?: string): ApiResult<Booking> =>
    apiClient.post(endpoints.bookings.reject(id), reason ? { reason } : {}),

  cancel: (id: string | number): ApiResult<Booking> =>
    apiClient.post(endpoints.bookings.cancel(id)),

  complete: (id: string | number): ApiResult<Booking> =>
    apiClient.post(endpoints.bookings.complete(id)),

  my: (): ApiResult<MaybePaginated<Booking>> => apiClient.get(endpoints.bookings.my),

  teacher: (): ApiResult<MaybePaginated<Booking>> => apiClient.get(endpoints.bookings.teacher),
};

export const studentsApi = {
  myEnrollments: (): ApiResult<MaybePaginated<Enrollment>> =>
    apiClient.get(endpoints.enrollments.myEnrollments),

  requestCourse: (courseId: string | number, payload: Record<string, unknown>): ApiResult<Enrollment> =>
    apiClient.post(endpoints.enrollments.enroll(courseId), payload),

  cancelEnrollment: (id: string | number): ApiResult<unknown> =>
    apiClient.request("DELETE", endpoints.enrollments.cancel(id)),
};

export const enrollmentsApi = {
  tutorRequests: (): ApiResult<MaybePaginated<Enrollment>> =>
    apiClient.get(endpoints.enrollments.tutorRequests),

  accept: (id: string | number): ApiResult<Enrollment> =>
    apiClient.post(endpoints.enrollments.accept(id)),

  acceptAndSchedule: (
    id: string | number,
    payload: { date: string; time: string; duration_minutes: number }
  ): ApiResult<Enrollment> => apiClient.post(endpoints.enrollments.acceptAndSchedule(id), payload),

  reject: (id: string | number): ApiResult<Enrollment> =>
    apiClient.post(endpoints.enrollments.reject(id)),

  forCourse: (courseId: string | number): ApiResult<Enrollment> =>
    apiClient.get(endpoints.enrollments.forCourse(courseId)),
};
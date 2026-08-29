import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";
import { Lesson, MeetingToken } from "../types/lesson";

export const lessonsApi = {
  list: (): ApiResult<Lesson[]> => apiClient.get(endpoints.lessons.list),
  byId: (id: string | number): ApiResult<Lesson> => apiClient.get(endpoints.lessons.byId(id)),
  create: (payload: Record<string, unknown>): ApiResult<Lesson> =>
    apiClient.post(endpoints.lessons.create, payload),
  start: (id: string | number): ApiResult<Lesson> => apiClient.post(endpoints.lessons.start(id)),
  complete: (id: string | number): ApiResult<Lesson> =>
    apiClient.post(endpoints.lessons.complete(id)),
  cancel: (id: string | number): ApiResult<Lesson> => apiClient.post(endpoints.lessons.cancel(id)),
};

export const meetingsApi = {
  token: (bookingId: string | number): ApiResult<MeetingToken> =>
    apiClient.post(endpoints.meetings.token(bookingId)),
  end: (bookingId: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.meetings.end(bookingId)),
};

export const reviewsApi = {
  byCourse: (
    courseId: string | number
  ): ApiResult<{ id?: string | number; rating?: number; comment?: string; student_name?: string; student_avatar?: string }[]> =>
    apiClient.get(endpoints.reviews.list(courseId), false),
  create: (courseId: string | number, payload: { rating: number; comment?: string }): ApiResult<unknown> =>
    apiClient.post(endpoints.reviews.create(courseId), payload),
  createForBooking: (
    courseId: string | number,
    bookingId: string | number,
    payload: { rating: number; comment?: string }
  ): ApiResult<unknown> => apiClient.post(endpoints.reviews.createForBooking(courseId, bookingId), payload),
};
import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { ReviewDTO, CreateReviewPayload } from "../types/api";

export const reviewsApi = {
  byCourse: (courseId: string | number): Promise<HttpResult<ReviewDTO[] | unknown>> =>
    apiClient.get(endpoints.reviews.list(courseId), false),

  create: (courseId: string | number, payload: CreateReviewPayload): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.reviews.create(courseId), payload),

  createForBooking: (
    courseId: string | number,
    bookingId: string | number,
    payload: CreateReviewPayload
  ): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.reviews.createForBooking(courseId, bookingId), payload),
};

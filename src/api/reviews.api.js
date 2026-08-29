import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const reviewsApi = {
  byCourse: (courseId) => apiClient.get(endpoints.reviews.list(courseId), false),
  create: (courseId, payload) => apiClient.post(endpoints.reviews.create(courseId), payload),
  createForBooking: (courseId, bookingId, payload) =>
    apiClient.post(endpoints.reviews.createForBooking(courseId, bookingId), payload),
};

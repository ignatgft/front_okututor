import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const enrollmentsApi = {
  byId: (id) => apiClient.get(endpoints.enrollments.byId(id)),
  tutorRequests: () => apiClient.get(endpoints.enrollments.tutorRequests),
  accept: (id) => apiClient.post(endpoints.enrollments.accept(id)),
  acceptAndSchedule: (id, payload) =>
    apiClient.post(endpoints.enrollments.acceptAndSchedule(id), payload),
  reject: (id, payload) => apiClient.post(endpoints.enrollments.reject(id), payload || {}),
  requestInfo: (id, payload = {}) => {
    const body = payload.request ? payload : payload.question ? { request: payload.question } : payload;
    return apiClient.post(endpoints.enrollments.requestInfo(id), body || {});
  },
  provideInfo: (id, payload = {}) => {
    // backend expects {message} at /applications/{id}/submit-info
    const body = payload.message ? payload : { message: payload.request || payload.question || "" };
    return apiClient.post(endpoints.enrollments.provideInfo(id), body || {});
  },
  forCourse: (courseId) => apiClient.get(endpoints.enrollments.forCourse(courseId)),
};

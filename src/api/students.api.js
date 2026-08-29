import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const studentsApi = {
  myEnrollments: () => apiClient.get(endpoints.enrollments.myEnrollments),
  requestCourse: (courseId, payload) => apiClient.post(endpoints.enrollments.enroll(courseId), payload),
  cancelEnrollment: (id) => apiClient.request("DELETE", endpoints.enrollments.cancel(id)),
};

export const enrollmentsApi = {
  tutorRequests: () => apiClient.get(endpoints.enrollments.tutorRequests),
  accept: (id) => apiClient.post(endpoints.enrollments.accept(id)),
  acceptAndSchedule: (id, payload) =>
    apiClient.post(endpoints.enrollments.acceptAndSchedule(id), payload),
  reject: (id) => apiClient.post(endpoints.enrollments.reject(id)),
  forCourse: (courseId) => apiClient.get(endpoints.enrollments.forCourse(courseId)),
};

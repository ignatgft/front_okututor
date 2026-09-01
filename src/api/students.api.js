import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const studentsApi = {
  myEnrollments: () => apiClient.get(endpoints.enrollments.myEnrollments),
  requestCourse: (courseId, payload) => apiClient.post(endpoints.enrollments.enroll(courseId), payload),
  cancelEnrollment: (id) => apiClient.request("DELETE", endpoints.enrollments.cancel(id)),
};

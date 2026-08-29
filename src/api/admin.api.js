import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const adminApi = {
  users: (query = "") => apiClient.get(`${endpoints.admin.users}${query}`),
  blockUser: (id) => apiClient.put(endpoints.admin.block(id)),
  unblockUser: (id) => apiClient.put(endpoints.admin.unblock(id)),
  changeRole: (id, role) => apiClient.put(endpoints.admin.role(id), { role }),
  verifyTutor: (id) => apiClient.put(endpoints.admin.verify(id)),
  stats: () => apiClient.get(endpoints.admin.stats),
  tutorApplications: (status = "") =>
    apiClient.get(`${endpoints.admin.tutors}${status ? `?status=${status}` : ""}`),
  approveTutor: (id) => apiClient.post(endpoints.admin.approveTutor(id)),
  rejectTutor: (id, reason) => apiClient.post(endpoints.admin.rejectTutor(id), { reason }),
  courses: (status = "") =>
    apiClient.get(`${endpoints.admin.courses}${status ? `?status=${status}` : ""}`),
  approveCourse: (id) => apiClient.post(endpoints.admin.approveCourse(id)),
  rejectCourse: (id, reason) => apiClient.post(endpoints.admin.rejectCourse(id), { reason }),
  reviews: () => apiClient.get(endpoints.admin.reviews),
  hideReview: (id) => apiClient.post(endpoints.admin.hideReview(id)),
  restoreReview: (id) => apiClient.post(endpoints.admin.restoreReview(id)),
  reports: () => apiClient.get(endpoints.admin.reports),
  updateReport: (id, payload) => apiClient.put(endpoints.admin.updateReport(id), payload),
};

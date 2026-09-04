import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";

export const adminApi = {
  users: (query = ""): Promise<HttpResult<unknown>> => apiClient.get(`${endpoints.admin.users}${query}`),

  blockUser: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.admin.block(id)),

  unblockUser: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.admin.unblock(id)),

  changeRole: (id: string | number, role: string): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.admin.role(id), { role }),

  verifyTutor: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.admin.verify(id)),

  stats: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.admin.stats),

  tutorApplications: (status = ""): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.admin.tutors}${status ? `?status=${status}` : ""}`),

  approveTutor: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.admin.approveTutor(id)),

  rejectTutor: (id: string | number, reason: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.admin.rejectTutor(id), { reason }),

  courses: (status = ""): Promise<HttpResult<unknown>> =>
    apiClient.get(`${endpoints.admin.courses}${status ? `?status=${status}` : ""}`),

  approveCourse: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.admin.approveCourse(id)),

  rejectCourse: (id: string | number, reason: string): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.admin.rejectCourse(id), { reason }),

  reviews: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.admin.reviews),

  hideReview: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.admin.hideReview(id)),

  restoreReview: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.post(endpoints.admin.restoreReview(id)),

  reports: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.admin.reports),

  updateReport: (id: string | number, payload: Record<string, unknown>): Promise<HttpResult<unknown>> =>
    apiClient.put(endpoints.admin.updateReport(id), payload),
};

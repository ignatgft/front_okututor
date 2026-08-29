import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";

export const adminApi = {
  users: (query = ""): ApiResult<unknown> => apiClient.get(`${endpoints.admin.users}${query}`),
  blockUser: (id: string | number): ApiResult<unknown> => apiClient.put(endpoints.admin.block(id)),
  unblockUser: (id: string | number): ApiResult<unknown> => apiClient.put(endpoints.admin.unblock(id)),
  changeRole: (id: string | number, role: string): ApiResult<unknown> =>
    apiClient.put(endpoints.admin.role(id), { role }),
  verifyTutor: (id: string | number): ApiResult<unknown> => apiClient.put(endpoints.admin.verify(id)),
  stats: (): ApiResult<unknown> => apiClient.get(endpoints.admin.stats),
  tutorApplications: (status = ""): ApiResult<unknown> =>
    apiClient.get(`${endpoints.admin.tutors}${status ? `?status=${status}` : ""}`),
  approveTutor: (id: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.admin.approveTutor(id)),
  rejectTutor: (id: string | number, reason: string): ApiResult<unknown> =>
    apiClient.post(endpoints.admin.rejectTutor(id), { reason }),
  courses: (status = ""): ApiResult<unknown> =>
    apiClient.get(`${endpoints.admin.courses}${status ? `?status=${status}` : ""}`),
  approveCourse: (id: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.admin.approveCourse(id)),
  rejectCourse: (id: string | number, reason: string): ApiResult<unknown> =>
    apiClient.post(endpoints.admin.rejectCourse(id), { reason }),
  reviews: (): ApiResult<unknown> => apiClient.get(endpoints.admin.reviews),
  hideReview: (id: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.admin.hideReview(id)),
  restoreReview: (id: string | number): ApiResult<unknown> =>
    apiClient.post(endpoints.admin.restoreReview(id)),
  reports: (): ApiResult<unknown> => apiClient.get(endpoints.admin.reports),
  updateReport: (id: string | number, payload: Record<string, unknown>): ApiResult<unknown> =>
    apiClient.put(endpoints.admin.updateReport(id), payload),
};
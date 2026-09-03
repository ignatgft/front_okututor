import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const lessonsApi = {
  list: (params = "?page=0&size=100") => apiClient.get(`${endpoints.lessons.list}${params}`),
  byId: (id) => apiClient.get(endpoints.lessons.byId(id)),
  dto: (id) => apiClient.get(endpoints.lessons.dto(id)),
  create: (payload) => apiClient.post(endpoints.lessons.create, payload),
  start: (id) => apiClient.post(endpoints.lessons.start(id)),
  complete: (id) => apiClient.post(endpoints.lessons.complete(id)),
  cancel: (id, reason) => apiClient.post(endpoints.lessons.cancel(id), reason ? { reason } : {}),
  studentNoShow: (id) => apiClient.post(endpoints.lessons.studentNoShow(id)),
  tutorNoShow: (id, reason) => apiClient.post(endpoints.lessons.tutorNoShow(id), reason ? { reason } : {}),
  issue: (id, reason) => apiClient.post(endpoints.lessons.issue(id), reason ? { reason } : {}),
  join: (id) => apiClient.post(endpoints.lessons.join(id)),
  review: (id, payload) => apiClient.post(endpoints.lessons.review(id), payload),
  details: (id, payload) => apiClient.post(endpoints.lessons.details(id), payload),
  // pending flows
  reschedulePropose: (id, payload) => apiClient.post(endpoints.lessons.reschedulePropose(id), payload),
  rescheduleAccept: (id) => apiClient.post(endpoints.lessons.rescheduleAccept(id)),
  rescheduleReject: (id) => apiClient.post(endpoints.lessons.rescheduleReject(id)),
  reschedule: (id, payload) => apiClient.post(endpoints.lessons.reschedule(id), payload),
  formatPropose: (id, payload) => apiClient.post(endpoints.lessons.formatPropose(id), payload),
  formatAccept: (id) => apiClient.post(endpoints.lessons.formatAccept(id)),
  formatReject: (id) => apiClient.post(endpoints.lessons.formatReject(id)),
  locationPropose: (id, payload) => apiClient.post(endpoints.lessons.locationPropose(id), payload),
  locationAccept: (id) => apiClient.post(endpoints.lessons.locationAccept(id)),
  locationReject: (id) => apiClient.post(endpoints.lessons.locationReject(id)),
  durationPropose: (id, payload) => apiClient.post(endpoints.lessons.durationPropose(id), payload),
  durationAccept: (id) => apiClient.post(endpoints.lessons.durationAccept(id)),
  durationReject: (id) => apiClient.post(endpoints.lessons.durationReject(id)),
};

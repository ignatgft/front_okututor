import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const lessonsApi = {
  list: (params = "?page=0&size=100") => apiClient.get(`${endpoints.lessons.list}${params}`),
  byId: (id) => apiClient.get(endpoints.lessons.byId(id)),
  create: (payload) => apiClient.post(endpoints.lessons.create, payload),
  start: (id) => apiClient.post(endpoints.lessons.start(id)),
  complete: (id) => apiClient.post(endpoints.lessons.complete(id)),
  cancel: (id) => apiClient.post(endpoints.lessons.cancel(id)),
};

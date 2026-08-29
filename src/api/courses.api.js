import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const coursesApi = {
  list: (query = "") => apiClient.get(`${endpoints.courses.list}${query}`, false),
  popular: () => apiClient.get(endpoints.courses.popular, false),
  byId: (id) => apiClient.get(endpoints.courses.byId(id)),
  create: (payload) => apiClient.post(endpoints.courses.create, payload),
  update: (id, payload) => apiClient.put(endpoints.courses.update(id), payload),
  delete: (id) => apiClient.delete(endpoints.courses.delete(id)),
  byTeacher: (teacherId) => apiClient.get(endpoints.courses.byTeacher(teacherId)),
};

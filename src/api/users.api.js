import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const usersApi = {
  me: () => apiClient.get(endpoints.users.me),
  updateMe: (payload) => apiClient.put(endpoints.users.update, payload),
  updateAvatar: (formData) => apiClient.request("PUT", endpoints.users.avatar, formData),
  byId: (id) => apiClient.get(endpoints.users.byId(id)),
  tutors: () => apiClient.get(endpoints.users.tutors),
};

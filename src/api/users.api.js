import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { uploadFile } from "./client/upload";

export const usersApi = {
  me: () => apiClient.get(endpoints.users.me),
  updateMe: (payload) => apiClient.put(endpoints.users.update, payload),
  updateAvatar: (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return uploadFile({
      endpoint: endpoints.users.avatar,
      fieldName: "file",
      method: "PUT",
      file,
      onProgress,
    });
  },
  deleteAvatar: () => apiClient.delete(endpoints.users.avatar),
  byId: (id) => apiClient.get(endpoints.users.byId(id)),
  tutors: () => apiClient.get(endpoints.users.tutors),
};

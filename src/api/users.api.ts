import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { uploadFile } from "./client/upload";
import type { HttpResult } from "./client/responseParser";
import type { UserDTO } from "../types/api";

export const usersApi = {
  me: (): Promise<HttpResult<UserDTO>> => apiClient.get<UserDTO>(endpoints.users.me),

  updateMe: (payload: Record<string, unknown>): Promise<HttpResult<UserDTO>> =>
    apiClient.put<UserDTO>(endpoints.users.update, payload),

  updateAvatar: (file: File, onProgress?: (p: number) => void): Promise<HttpResult<unknown>> => {
    // Keep FormData path for backwards-compat but uploadFile handles multipart correctly
    return uploadFile({
      endpoint: endpoints.users.avatar,
      fieldName: "file",
      method: "PUT",
      file,
      onProgress,
    });
  },

  deleteAvatar: (): Promise<HttpResult<unknown>> => apiClient.delete(endpoints.users.avatar),

  byId: (id: string | number): Promise<HttpResult<UserDTO>> =>
    apiClient.get<UserDTO>(endpoints.users.byId(id)),

  tutors: (): Promise<HttpResult<UserDTO[] | unknown>> => apiClient.get(endpoints.users.tutors),
};

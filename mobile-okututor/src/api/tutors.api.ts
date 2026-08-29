import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import { ApiResult } from "./types";
import { TutorApplication, TutorApplicationPayload } from "../types/tutor";
import { AvailabilitySlot } from "../utils/slots";

export const tutorsApi = {
  submitApplication: (payload: TutorApplicationPayload): ApiResult<TutorApplication> =>
    apiClient.post(endpoints.tutors.applications, payload),

  myApplication: (): ApiResult<TutorApplication> => apiClient.get(endpoints.tutors.myApplication),

  byId: (id: string | number): ApiResult<unknown> => apiClient.get(endpoints.tutors.byId(id)),

  availability: (): ApiResult<AvailabilitySlot[]> => apiClient.get(endpoints.tutors.availability),

  availabilityByTeacher: (id: string | number): ApiResult<AvailabilitySlot[]> =>
    apiClient.get(endpoints.tutors.availabilityByTeacher(id)),

  addAvailability: (payload: Omit<AvailabilitySlot, "id">): ApiResult<AvailabilitySlot> =>
    apiClient.post(endpoints.tutors.availability, payload),

  removeAvailability: (id: string | number): ApiResult<unknown> =>
    apiClient.delete(endpoints.tutors.availabilityById(id)),
};

export const usersApi = {
  me: (): ApiResult<unknown> => apiClient.get(endpoints.users.me),
  updateMe: (payload: Record<string, unknown>): ApiResult<unknown> =>
    apiClient.put(endpoints.users.update, payload),
  updateAvatar: (formData: FormData): ApiResult<unknown> =>
    apiClient.request("PUT", endpoints.users.avatar, formData),
  byId: (id: string | number): ApiResult<unknown> => apiClient.get(endpoints.users.byId(id)),
  tutors: (): ApiResult<unknown> => apiClient.get(endpoints.users.tutors),
};
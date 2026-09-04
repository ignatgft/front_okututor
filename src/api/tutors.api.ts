import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { TutorApplicationDTO, TutorApplicationPayload, AvailabilitySlot } from "../types/api";

export const tutorsApi = {
  submitApplication: (payload: TutorApplicationPayload): Promise<HttpResult<TutorApplicationDTO>> =>
    apiClient.post<TutorApplicationDTO>(endpoints.tutors.applications, payload),

  myApplication: (): Promise<HttpResult<TutorApplicationDTO>> =>
    apiClient.get<TutorApplicationDTO>(endpoints.tutors.myApplication),

  byId: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.get(endpoints.tutors.byId(id)),

  availability: (): Promise<HttpResult<AvailabilitySlot[] | unknown>> =>
    apiClient.get(endpoints.tutors.availability),

  availabilityByTeacher: (id: string | number): Promise<HttpResult<AvailabilitySlot[] | unknown>> =>
    apiClient.get(endpoints.tutors.availabilityByTeacher(id)),

  addAvailability: (payload: Omit<AvailabilitySlot, "id">): Promise<HttpResult<AvailabilitySlot>> =>
    apiClient.post<AvailabilitySlot>(endpoints.tutors.availability, payload),

  removeAvailability: (id: string | number): Promise<HttpResult<unknown>> =>
    apiClient.delete(endpoints.tutors.availabilityById(id)),
};

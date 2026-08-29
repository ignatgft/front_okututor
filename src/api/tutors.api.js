import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const tutorsApi = {
  submitApplication: (payload) => apiClient.post(endpoints.tutors.applications, payload),
  myApplication: () => apiClient.get(endpoints.tutors.myApplication),
  byId: (id) => apiClient.get(endpoints.tutors.byId(id)),
  availability: () => apiClient.get(endpoints.tutors.availability),
  availabilityByTeacher: (id) => apiClient.get(endpoints.tutors.availabilityByTeacher(id)),
  addAvailability: (payload) => apiClient.post(endpoints.tutors.availability, payload),
  removeAvailability: (id) => apiClient.delete(endpoints.tutors.availabilityById(id)),
};

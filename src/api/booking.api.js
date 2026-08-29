import { endpoints } from "./endpoints";
import { apiClient } from "./http";

export const bookingApi = {
  byId: (id) => apiClient.get(endpoints.bookings.byId(id)),
  create: (payload) => apiClient.post(endpoints.bookings.create, payload),
  confirm: (id) => apiClient.post(endpoints.bookings.confirm(id)),
  reject: (id) => apiClient.post(endpoints.bookings.reject(id)),
  cancel: (id) => apiClient.post(endpoints.bookings.cancel(id)),
  complete: (id) => apiClient.post(endpoints.bookings.complete(id)),
  my: () => apiClient.get(endpoints.bookings.my),
  teacher: () => apiClient.get(endpoints.bookings.teacher),
};

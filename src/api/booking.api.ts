import { endpoints } from "./endpoints";
import { apiClient } from "./http";
import type { HttpResult } from "./client/responseParser";
import type { BookingDTO, CreateBookingPayload } from "../types/api";

export const bookingApi = {
  byId: (id: string | number): Promise<HttpResult<BookingDTO>> =>
    apiClient.get<BookingDTO>(endpoints.bookings.byId(id)),

  create: (payload: CreateBookingPayload): Promise<HttpResult<BookingDTO>> =>
    apiClient.post<BookingDTO>(endpoints.bookings.create, payload),

  confirm: (id: string | number): Promise<HttpResult<BookingDTO>> =>
    apiClient.post<BookingDTO>(endpoints.bookings.confirm(id)),

  reject: (id: string | number): Promise<HttpResult<BookingDTO>> =>
    apiClient.post<BookingDTO>(endpoints.bookings.reject(id)),

  cancel: (id: string | number): Promise<HttpResult<BookingDTO>> =>
    apiClient.post<BookingDTO>(endpoints.bookings.cancel(id)),

  complete: (id: string | number): Promise<HttpResult<BookingDTO>> =>
    apiClient.post<BookingDTO>(endpoints.bookings.complete(id)),

  my: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.bookings.my),

  teacher: (): Promise<HttpResult<unknown>> => apiClient.get(endpoints.bookings.teacher),
};

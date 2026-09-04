export const bookings = {
  create: "/api/v1/bookings",
  byId: (id: string | number): string => `/api/v1/bookings/${id}`,
  confirm: (id: string | number): string => `/api/v1/bookings/${id}/confirm`,
  reject: (id: string | number): string => `/api/v1/bookings/${id}/reject`,
  cancel: (id: string | number): string => `/api/v1/bookings/${id}/cancel`,
  complete: (id: string | number): string => `/api/v1/bookings/${id}/complete`,
  my: "/api/v1/bookings/me",
  teacher: "/api/v1/bookings/teacher",
} as const;

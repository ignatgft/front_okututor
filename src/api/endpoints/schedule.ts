export const schedule = {
  propose: (applicationId: string | number): string => `/api/v1/schedule/applications/${applicationId}/propose`,
  proposals: (applicationId: string | number): string => `/api/v1/schedule/applications/${applicationId}/proposals`,
  proposal: (id: string | number): string => `/api/v1/schedule/proposals/${id}`,
  accept: (id: string | number): string => `/api/v1/schedule/proposals/${id}/accept`,
  reject: (id: string | number): string => `/api/v1/schedule/proposals/${id}/reject`,
  counter: (id: string | number): string => `/api/v1/schedule/proposals/${id}/counter`,
  my: "/api/v1/schedule/me",
  byId: (id: string | number): string => `/api/v1/schedule/${id}`,
  lessons: (id: string | number): string => `/api/v1/schedule/${id}/lessons`,
  availableSlots: (applicationId: string | number): string =>
    `/api/v1/schedule/applications/${applicationId}/available-slots`,
  checkAvailability: "/api/v1/schedule/check-availability",
} as const;

export const lessons = {
  list: "/api/v1/lessons",
  byId: (id: string | number): string => `/api/v1/lessons/${id}`,
  dto: (id: string | number): string => `/api/v1/lessons/${id}/dto`,
  create: "/api/v1/lessons",
  cancel: (id: string | number): string => `/api/v1/lessons/${id}/cancel`,
  complete: (id: string | number): string => `/api/v1/lessons/${id}/complete`,
  start: (id: string | number): string => `/api/v1/lessons/${id}/start`,
  studentNoShow: (id: string | number): string => `/api/v1/lessons/${id}/student-no-show`,
  tutorNoShow: (id: string | number): string => `/api/v1/lessons/${id}/tutor-no-show`,
  issue: (id: string | number): string => `/api/v1/lessons/${id}/issue`,
  join: (id: string | number): string => `/api/v1/lessons/${id}/join`,
  review: (id: string | number): string => `/api/v1/lessons/${id}/review`,
  details: (id: string | number): string => `/api/v1/lessons/${id}/details`,
  reschedulePropose: (id: string | number): string => `/api/v1/lessons/${id}/reschedule/propose`,
  rescheduleAccept: (id: string | number): string => `/api/v1/lessons/${id}/reschedule/accept`,
  rescheduleReject: (id: string | number): string => `/api/v1/lessons/${id}/reschedule/reject`,
  reschedule: (id: string | number): string => `/api/v1/lessons/${id}/reschedule`,
  formatPropose: (id: string | number): string => `/api/v1/lessons/${id}/format/propose`,
  formatAccept: (id: string | number): string => `/api/v1/lessons/${id}/format/accept`,
  formatReject: (id: string | number): string => `/api/v1/lessons/${id}/format/reject`,
  locationPropose: (id: string | number): string => `/api/v1/lessons/${id}/location/propose`,
  locationAccept: (id: string | number): string => `/api/v1/lessons/${id}/location/accept`,
  locationReject: (id: string | number): string => `/api/v1/lessons/${id}/location/reject`,
  durationPropose: (id: string | number): string => `/api/v1/lessons/${id}/duration/propose`,
  durationAccept: (id: string | number): string => `/api/v1/lessons/${id}/duration/accept`,
  durationReject: (id: string | number): string => `/api/v1/lessons/${id}/duration/reject`,
} as const;

export const calendar = {
  range: (from: string, to: string, tz?: string): string =>
    `/api/v1/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&tz=${encodeURIComponent(tz ?? "")}`,
} as const;

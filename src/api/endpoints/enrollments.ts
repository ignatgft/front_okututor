export const enrollments = {
  enroll: (courseId: string | number): string => `/api/v1/courses/${courseId}/enroll`,
  myEnrollments: "/api/v1/students/me/enrollments",
  tutorRequests: "/api/v1/tutors/me/requests",
  byId: (id: string | number): string => `/api/v1/enrollments/${id}`,
  accept: (id: string | number): string => `/api/v1/enrollments/${id}/accept`,
  acceptAndSchedule: (id: string | number): string => `/api/v1/enrollments/${id}/accept-and-schedule`,
  reject: (id: string | number): string => `/api/v1/enrollments/${id}/reject`,
  requestInfo: (id: string | number): string => `/api/v1/applications/${id}/request-info`,
  provideInfo: (id: string | number): string => `/api/v1/applications/${id}/submit-info`,
  cancel: (id: string | number): string => `/api/v1/enrollments/${id}`,
  forCourse: (courseId: string | number): string => `/api/v1/courses/${courseId}/enrollment`,
} as const;

export const applications = {
  requestInfo: (id: string | number): string => `/api/v1/applications/${id}/request-info`,
  submitInfo: (id: string | number): string => `/api/v1/applications/${id}/submit-info`,
  byId: (id: string | number): string => `/api/v1/applications/${id}`,
  timeline: (id: string | number): string => `/api/v1/applications/${id}/timeline`,
} as const;

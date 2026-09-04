export const courses = {
  list: "/api/v1/courses",
  popular: "/api/v1/courses/popular",
  byId: (id: string | number): string => `/api/v1/courses/${id}`,
  create: "/api/v1/courses",
  update: (id: string | number): string => `/api/v1/courses/${id}`,
  delete: (id: string | number): string => `/api/v1/courses/${id}`,
  byTeacher: (id: string | number): string => `/api/v1/courses/teacher/${id}`,
  canReview: (courseId: string | number): string => `/api/v1/courses/${courseId}/can-review`,
} as const;

export const search = {
  courses: "/api/v1/search/courses",
  coursesV2: "/api/v1/search/courses/v2",
  suggestions: "/api/v1/search/suggestions",
  tutors: "/api/v1/search/tutors",
} as const;

export const reviews = {
  list: (courseId: string | number): string => `/api/v1/courses/${courseId}/reviews`,
  create: (courseId: string | number): string => `/api/v1/courses/${courseId}/reviews`,
  createForBooking: (courseId: string | number, bookingId: string | number): string =>
    `/api/v1/courses/${courseId}/reviews/booking/${bookingId}`,
} as const;

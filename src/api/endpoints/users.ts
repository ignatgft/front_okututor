export const users = {
  me: "/api/v1/users/me",
  byId: (id: string | number): string => `/api/v1/users/${id}`,
  update: "/api/v1/users/me",
  avatar: "/api/v1/users/me/avatar",
  tutors: "/api/v1/users/tutors",
} as const;

export const tutors = {
  applications: "/api/v1/tutors/applications",
  myApplication: "/api/v1/tutors/applications/me",
  byId: (id: string | number): string => `/api/v1/tutors/${id}`,
  availability: "/api/v1/availability",
  availabilityById: (id: string | number): string => `/api/v1/availability/${id}`,
  availabilityByTeacher: (id: string | number): string => `/api/v1/tutors/${id}/availability`,
} as const;

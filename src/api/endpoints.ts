import { auth } from "./endpoints/auth";
import { users, tutors } from "./endpoints/users";
import { courses, search, reviews } from "./endpoints/courses";
import { bookings } from "./endpoints/bookings";
import { enrollments, applications } from "./endpoints/enrollments";
import { schedule, lessons, calendar } from "./endpoints/schedule";
import { messages, meetings, notifications, support, adminSupport, admin } from "./endpoints/messaging";

export const endpoints = {
  auth,
  tutors,
  users,
  courses,
  search,
  reviews,
  bookings,
  enrollments,
  applications,
  schedule,
  lessons,
  calendar,
  messages,
  meetings,
  notifications,
  support,
  adminSupport,
  admin,
} as const;

export const pageParams = (page = 0, size = 20): string => `page=${page}&size=${size}`;

export type Endpoints = typeof endpoints;

// Re-export individual groups for direct import if needed
export { auth, users, tutors, courses, search, reviews, bookings, enrollments, applications, schedule, lessons, calendar, messages, meetings, notifications, support, adminSupport, admin };

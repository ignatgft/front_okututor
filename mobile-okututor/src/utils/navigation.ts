import { isAdmin, isStudent, isTutor, Role } from "../constants/roles";

/**
 * Returns the root route shown right after authentication. Mirrors the web
 * app's `getDashboardPath` so students, tutors and admins land correctly.
 */
export function getDashboardPath(role: Role | string | undefined): string {
  if (isAdmin(role)) return "/admin";
  if (isTutor(role)) return "/(tabs)/dashboard";
  if (isStudent(role)) return "/(tabs)/home";
  return "/login";
}
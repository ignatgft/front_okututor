import {
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  Mail,
  Settings,
  Users,
  Bell,
  LifeBuoy,
  Inbox,
  Search,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  path: string;
}

export type RoleKey = "student" | "tutor" | "admin";

export const SIDEBAR_ITEMS: Record<RoleKey, NavItem[]> = {
  student: [
    { id: "dashboard", labelKey: "navbar.dashboard", icon: Home, path: "/student/dashboard" },
    { id: "search", labelKey: "navbar.find_tutor", icon: Search, path: "/student/search" },
    { id: "my_courses", labelKey: "student_courses.title", icon: BookOpen, path: "/student/courses" },
    { id: "requests", labelKey: "navigation.requests", icon: Inbox, path: "/student/requests" },
    { id: "schedule", labelKey: "navbar.schedule", icon: Calendar, path: "/student/schedule" },
    { id: "lessons", labelKey: "navbar.lessons", icon: BookOpen, path: "/student/lessons" },
    { id: "messages", labelKey: "navbar.messages", icon: Mail, path: "/student/messages" },
    { id: "notifications", labelKey: "notifications.title", icon: Bell, path: "/student/notifications" },
    { id: "progress", labelKey: "navbar.progress", icon: BarChart3, path: "/student/progress" },
    { id: "profile", labelKey: "navbar.profile", icon: Users, path: "/student/profile" },
    { id: "settings", labelKey: "navbar.settings", icon: Settings, path: "/student/settings" },
    { id: "support", labelKey: "navbar.support", icon: LifeBuoy, path: "/student/messages?filter=support" },
  ],
  tutor: [
    { id: "dashboard", labelKey: "tutor_dashboard.title", icon: Home, path: "/tutor/dashboard" },
    { id: "requests", labelKey: "navigation.requests", icon: Inbox, path: "/tutor/requests" },
    { id: "my_courses", labelKey: "profile.my_courses", icon: BookOpen, path: "/tutor/courses" },
    { id: "students", labelKey: "tutor_dashboard.students", icon: Users, path: "/tutor/students" },
    { id: "schedule", labelKey: "navbar.schedule", icon: Calendar, path: "/tutor/schedule" },
    { id: "lessons", labelKey: "navbar.lessons", icon: BookOpen, path: "/tutor/lessons" },
    { id: "messages", labelKey: "navbar.messages", icon: Mail, path: "/tutor/messages" },
    { id: "notifications", labelKey: "notifications.title", icon: Bell, path: "/tutor/notifications" },
    { id: "progress", labelKey: "navbar.progress", icon: BarChart3, path: "/tutor/progress" },
    { id: "profile", labelKey: "navbar.profile", icon: Users, path: "/tutor/profile" },
    { id: "settings", labelKey: "navbar.settings", icon: Settings, path: "/tutor/settings" },
    { id: "application", labelKey: "tutor.application", icon: BookOpen, path: "/tutor/application" },
    { id: "support", labelKey: "navbar.support", icon: LifeBuoy, path: "/tutor/messages?filter=support" },
  ],
  admin: [
    { id: "admin_dashboard", labelKey: "admin.dashboard", icon: Home, path: "/admin" },
    { id: "admin_metrics", labelKey: "admin.metrics", icon: BarChart3, path: "/admin/metrics" },
    { id: "admin_users", labelKey: "admin.users", icon: Users, path: "/admin/users" },
    { id: "admin_tutors", labelKey: "admin.tutor_applications", icon: BookOpen, path: "/admin/tutors" },
    { id: "admin_courses", labelKey: "admin.course_moderation", icon: BarChart3, path: "/admin/courses" },
    { id: "admin_reviews", labelKey: "admin.reviews_moderation", icon: Mail, path: "/admin/reviews" },
    { id: "admin_reports", labelKey: "admin.reports", icon: Calendar, path: "/admin/reports" },
    { id: "admin_support", labelKey: "admin.support", icon: LifeBuoy, path: "/admin/support" },
  ],
};

export const BOTTOMNAV_ITEMS: Record<RoleKey, NavItem[]> = {
  student: [
    { id: "home", path: "/student/dashboard", labelKey: "navbar.home", icon: Home },
    { id: "courses", path: "/student/courses", labelKey: "student_courses.title", icon: BookOpen },
    { id: "messages", path: "/student/messages", labelKey: "navbar.messages", icon: Mail },
    { id: "notifications", path: "/student/notifications", labelKey: "notifications.title", icon: Bell },
    { id: "profile", path: "/student/profile", labelKey: "navbar.profile", icon: Users },
    { id: "settings", path: "/student/settings", labelKey: "navbar.settings", icon: Settings },
  ],
  tutor: [
    { id: "dashboard", path: "/tutor/dashboard", labelKey: "navbar.home", icon: Home },
    { id: "courses", path: "/tutor/courses", labelKey: "profile.my_courses", icon: BookOpen },
    { id: "messages", path: "/tutor/messages", labelKey: "navbar.messages", icon: Mail },
    { id: "notifications", path: "/tutor/notifications", labelKey: "notifications.title", icon: Bell },
    { id: "profile", path: "/tutor/profile", labelKey: "navbar.profile", icon: Users },
    { id: "settings", path: "/tutor/settings", labelKey: "navbar.settings", icon: Settings },
  ],
  admin: [
    { id: "dashboard", path: "/admin", labelKey: "navbar.home", icon: Home },
    { id: "users", path: "/admin/users", labelKey: "admin.users", icon: Users },
    { id: "courses", path: "/admin/courses", labelKey: "admin.course_moderation", icon: BookOpen },
    { id: "notifications", path: "/admin/notifications", labelKey: "notifications.title", icon: Bell },
    { id: "support", path: "/admin/support", labelKey: "admin.support", icon: LifeBuoy },
    { id: "settings", path: "/admin/settings", labelKey: "navbar.settings", icon: Settings },
  ],
};

export const PAGE_TITLES: Record<RoleKey, Record<string, string>> = {
  student: {
    "/student/dashboard": "navbar.dashboard",
    "/student/search": "navbar.find_tutor",
    "/student/schedule": "navbar.schedule",
    "/student/lessons": "navbar.lessons",
    "/student/progress": "navbar.progress",
    "/student/messages": "navbar.messages",
    "/student/notifications": "notifications.title",
    "/student/profile": "navbar.profile",
    "/student/settings": "navbar.settings",
    "/student/courses": "student_courses.title",
    "/student/tutors": "student_tutors.title",
    "/student/requests": "student_requests.title",
  },
  tutor: {
    "/tutor/dashboard": "tutor_dashboard.title",
    "/tutor/courses": "profile.my_courses",
    "/tutor/courses/new": "tutor.create_course",
    "/tutor/courses/create": "tutor.create_course",
    "/tutor/students": "tutor_dashboard.students",
    "/tutor/requests": "navigation.requests",
    "/tutor/schedule": "navbar.schedule",
    "/tutor/lessons": "navbar.lessons",
    "/tutor/messages": "navbar.messages",
    "/tutor/notifications": "notifications.title",
    "/tutor/profile": "navbar.profile",
    "/tutor/settings": "navbar.settings",
    "/tutor/progress": "navbar.progress",
    "/tutor/application": "tutor.application",
  },
  admin: {
    "/admin": "admin.dashboard",
    "/admin/metrics": "admin.metrics",
    "/admin/users": "admin.users",
    "/admin/tutors": "admin.tutor_applications",
    "/admin/courses": "admin.course_moderation",
    "/admin/reviews": "admin.reviews_moderation",
    "/admin/reports": "admin.reports",
    "/admin/support": "admin.support",
    "/admin/profile": "navbar.profile",
    "/admin/settings": "navbar.settings",
  },
};

export const getPageTitle = (roleKey: string, pathname: string): string => {
  const titles = PAGE_TITLES[roleKey as RoleKey] ?? {};
  return titles[pathname] ?? "";
};

export const getDashboardPath = (role: unknown): string => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "TUTOR") return "/tutor/dashboard";
  return "/student/dashboard";
};

export const getSectionPath = (role: unknown): string => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "TUTOR") return "/tutor";
  return "/student";
};

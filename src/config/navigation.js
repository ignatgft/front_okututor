import { FaHome, FaBook, FaCalendar, FaChartBar, FaEnvelope, FaCog, FaSignOutAlt, FaUsers, FaBell, FaLifeRing, FaInbox } from "react-icons/fa";

export const SIDEBAR_ITEMS = {
  student: [
    { id: "dashboard", labelKey: "navbar.dashboard", icon: FaHome, path: "/student/dashboard" },
    { id: "search", labelKey: "navbar.find_tutor", icon: FaBook, path: "/student/search" },
    { id: "my_courses", labelKey: "student_courses.title", icon: FaBook, path: "/student/courses" },
    { id: "requests", labelKey: "navigation.requests", icon: FaInbox, path: "/student/requests" },
    { id: "schedule", labelKey: "navbar.schedule", icon: FaCalendar, path: "/student/schedule" },
    { id: "lessons", labelKey: "navbar.lessons", icon: FaBook, path: "/student/lessons" },
    { id: "messages", labelKey: "navbar.messages", icon: FaEnvelope, path: "/student/messages" },
    { id: "notifications", labelKey: "notifications.title", icon: FaBell, path: "/student/notifications" },
    { id: "progress", labelKey: "navbar.progress", icon: FaChartBar, path: "/student/progress" },
    { id: "profile", labelKey: "navbar.profile", icon: FaUsers, path: "/student/profile" },
    { id: "settings", labelKey: "navbar.settings", icon: FaCog, path: "/student/settings" },
    { id: "support", labelKey: "navbar.support", icon: FaLifeRing, path: "/student/messages?filter=support" },
  ],
  tutor: [
    { id: "dashboard", labelKey: "tutor_dashboard.title", icon: FaHome, path: "/tutor/dashboard" },
    { id: "requests", labelKey: "navigation.requests", icon: FaInbox, path: "/tutor/requests" },
    { id: "my_courses", labelKey: "profile.my_courses", icon: FaBook, path: "/tutor/courses" },
    { id: "students", labelKey: "tutor_dashboard.students", icon: FaUsers, path: "/tutor/students" },
    { id: "schedule", labelKey: "navbar.schedule", icon: FaCalendar, path: "/tutor/schedule" },
    { id: "lessons", labelKey: "navbar.lessons", icon: FaBook, path: "/tutor/lessons" },
    { id: "messages", labelKey: "navbar.messages", icon: FaEnvelope, path: "/tutor/messages" },
    { id: "notifications", labelKey: "notifications.title", icon: FaBell, path: "/tutor/notifications" },
    { id: "progress", labelKey: "navbar.progress", icon: FaChartBar, path: "/tutor/progress" },
    { id: "profile", labelKey: "navbar.profile", icon: FaUsers, path: "/tutor/profile" },
    { id: "settings", labelKey: "navbar.settings", icon: FaCog, path: "/tutor/settings" },
    { id: "application", labelKey: "tutor.application", icon: FaBook, path: "/tutor/application" },
    { id: "support", labelKey: "navbar.support", icon: FaLifeRing, path: "/tutor/messages?filter=support" },
  ],
  admin: [
    { id: "admin_dashboard", labelKey: "admin.dashboard", icon: FaHome, path: "/admin" },
    { id: "admin_users", labelKey: "admin.users", icon: FaUsers, path: "/admin/users" },
    { id: "admin_tutors", labelKey: "admin.tutor_applications", icon: FaBook, path: "/admin/tutors" },
    { id: "admin_courses", labelKey: "admin.course_moderation", icon: FaChartBar, path: "/admin/courses" },
    { id: "admin_reviews", labelKey: "admin.reviews_moderation", icon: FaEnvelope, path: "/admin/reviews" },
    { id: "admin_reports", labelKey: "admin.reports", icon: FaCalendar, path: "/admin/reports" },
    { id: "admin_support", labelKey: "admin.support", icon: FaLifeRing, path: "/admin/support" },
  ],
};

export const BOTTOMNAV_ITEMS = {
  student: [
    { id: "home", path: "/student/dashboard", labelKey: "navbar.home", icon: FaHome },
    { id: "courses", path: "/student/courses", labelKey: "student_courses.title", icon: FaBook },
    { id: "messages", path: "/student/messages", labelKey: "navbar.messages", icon: FaEnvelope },
    { id: "support", path: "/student/messages?filter=support", labelKey: "navbar.support", icon: FaLifeRing },
    { id: "profile", path: "/student/profile", labelKey: "navbar.profile", icon: FaUsers },
  ],
  tutor: [
    { id: "dashboard", path: "/tutor/dashboard", labelKey: "navbar.home", icon: FaHome },
    { id: "courses", path: "/tutor/courses", labelKey: "profile.my_courses", icon: FaBook },
    { id: "messages", path: "/tutor/messages", labelKey: "navbar.messages", icon: FaEnvelope },
    { id: "support", path: "/tutor/messages?filter=support", labelKey: "navbar.support", icon: FaLifeRing },
    { id: "profile", path: "/tutor/profile", labelKey: "navbar.profile", icon: FaUsers },
  ],
  admin: [
    { id: "dashboard", path: "/admin", labelKey: "navbar.home", icon: FaHome },
    { id: "users", path: "/admin/users", labelKey: "admin.users", icon: FaUsers },
    { id: "courses", path: "/admin/courses", labelKey: "admin.course_moderation", icon: FaBook },
    { id: "support", path: "/admin/support", labelKey: "admin.support", icon: FaLifeRing },
    { id: "settings", path: "/admin/settings", labelKey: "navbar.settings", icon: FaCog },
  ],
};

export const PAGE_TITLES = {
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

export const getPageTitle = (roleKey, pathname) => {
  const titles = PAGE_TITLES[roleKey] || {};
  return titles[pathname] || "";
};

export const getDashboardPath = (role) => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "TUTOR") return "/tutor/dashboard";
  return "/student/dashboard";
};

export const getSectionPath = (role) => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "TUTOR") return "/tutor";
  return "/student";
};

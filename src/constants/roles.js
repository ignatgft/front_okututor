export const ROLES = {
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

export const ROLE_LIST = Object.values(ROLES);

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const isStudent = (role) => role === ROLES.STUDENT;
export const isTutor = (role) => role === ROLES.TUTOR;
export const isAdmin = (role) => ADMIN_ROLES.includes(role);
export const isSuperAdmin = (role) => role === ROLES.SUPER_ADMIN;
export const isTutorLike = (role) => role === ROLES.TUTOR || ADMIN_ROLES.includes(role);

const PERMISSIONS = {
  [ROLES.STUDENT]: [
    "courses.view",
    "enrollments.manage",
    "bookings.manage",
    "messages.read",
    "messages.send",
    "support.create",
    "support.reply",
    "profile.edit",
  ],
  [ROLES.TUTOR]: [
    "courses.view",
    "courses.create",
    "courses.edit",
    "courses.submit",
    "enrollments.manage",
    "bookings.manage",
    "students.view",
    "lessons.manage",
    "messages.read",
    "messages.send",
    "support.create",
    "support.reply",
    "profile.edit",
  ],
  [ROLES.ADMIN]: [
    "users.view",
    "users.manage",
    "tutors.moderate",
    "courses.moderate",
    "reviews.moderate",
    "reports.view",
    "reports.manage",
    "support.view",
    "support.reply",
    "support.assign",
    "support.manage",
    "profile.edit",
  ],
  [ROLES.SUPER_ADMIN]: [
    "users.view",
    "users.manage",
    "tutors.moderate",
    "courses.moderate",
    "reviews.moderate",
    "reports.view",
    "reports.manage",
    "support.view",
    "support.reply",
    "support.assign",
    "support.manage",
    "admins.manage",
    "system.audit",
    "system.settings",
    "profile.edit",
  ],
};

export const getPermissions = (role) => PERMISSIONS[role] || [];
export const hasPermission = (role, permission) => {
  const perms = PERMISSIONS[role] || [];
  return perms.includes(permission);
};

export const CONVERSATION_TYPES = {
  DIRECT: "DIRECT",
  SUPPORT: "SUPPORT",
  SYSTEM: "SYSTEM",
};

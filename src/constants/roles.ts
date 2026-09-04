export const ROLES = {
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST: readonly Role[] = Object.values(ROLES);

export const ADMIN_ROLES: readonly Role[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const isStudent = (role: unknown): boolean => role === ROLES.STUDENT;

export const isTutor = (role: unknown): boolean => role === ROLES.TUTOR;

export const isAdmin = (role: unknown): boolean =>
  typeof role === "string" && (ADMIN_ROLES as readonly string[]).includes(role);

export const isSuperAdmin = (role: unknown): boolean => role === ROLES.SUPER_ADMIN;

export const isTutorLike = (role: unknown): boolean =>
  role === ROLES.TUTOR || (typeof role === "string" && (ADMIN_ROLES as readonly string[]).includes(role));

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
} as const;

export type Permission = (typeof PERMISSIONS)[Role][number];

export const getPermissions = (role: unknown): readonly string[] => {
  if (typeof role === "string" && role in PERMISSIONS) {
    return PERMISSIONS[role as Role];
  }
  return [];
};

export const hasPermission = (role: unknown, permission: unknown): boolean => {
  if (typeof permission !== "string") return false;
  const perms = getPermissions(role);
  return (perms as readonly string[]).includes(permission);
};

export const CONVERSATION_TYPES = {
  DIRECT: "DIRECT",
  SUPPORT: "SUPPORT",
  SYSTEM: "SYSTEM",
} as const;

export type ConversationType = (typeof CONVERSATION_TYPES)[keyof typeof CONVERSATION_TYPES];

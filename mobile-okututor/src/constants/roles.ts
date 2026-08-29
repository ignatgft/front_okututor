export const ROLES = {
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_LIST = Object.values(ROLES);

export const ADMIN_ROLES: readonly Role[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const isStudent = (role: string | undefined): boolean => role === ROLES.STUDENT;
export const isTutor = (role: string | undefined): boolean => role === ROLES.TUTOR;
export const isAdmin = (role: string | undefined): boolean => !!role && (ADMIN_ROLES as readonly string[]).includes(role);
export const isSuperAdmin = (role: string | undefined): boolean => role === ROLES.SUPER_ADMIN;
export const isTutorLike = (role: string | undefined): boolean =>
  role === ROLES.TUTOR || isAdmin(role);

const PERMISSIONS: Record<string, string[]> = {
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

export const getPermissions = (role: string | undefined): string[] => (role ? PERMISSIONS[role] || [] : []);
export const hasPermission = (role: string | undefined, permission: string): boolean =>
  getPermissions(role).includes(permission);

export const CONVERSATION_TYPES = {
  DIRECT: "DIRECT",
  SUPPORT: "SUPPORT",
  SYSTEM: "SYSTEM",
} as const;

export type ConversationType = (typeof CONVERSATION_TYPES)[keyof typeof CONVERSATION_TYPES];
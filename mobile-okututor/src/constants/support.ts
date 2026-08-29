export const TICKET_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_USER: "WAITING_FOR_USER",
  WAITING_FOR_SUPPORT: "WAITING_FOR_SUPPORT",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export const TICKET_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const TICKET_CATEGORY = {
  TECHNICAL: "TECHNICAL",
  PAYMENT: "PAYMENT",
  ACCOUNT: "ACCOUNT",
  LESSON: "LESSON",
  COURSE: "COURSE",
  TUTOR: "TUTOR",
  STUDENT: "STUDENT",
  BUG: "BUG",
  OTHER: "OTHER",
} as const;

export const MESSAGE_TYPE = {
  USER_VISIBLE: "USER_VISIBLE",
  INTERNAL_NOTE: "INTERNAL_NOTE",
} as const;

export const MESSAGE_CLIENT_STATUS = {
  SENDING: "SENDING",
  SENT: "SENT",
  FAILED: "FAILED",
} as const;

export const STATUS_LABELS = Object.values(TICKET_STATUS);
export const PRIORITY_LABELS = Object.values(TICKET_PRIORITY);
export const CATEGORY_LABELS = Object.values(TICKET_CATEGORY);

export const STATUS_I18N: Record<string, string> = {
  [TICKET_STATUS.OPEN]: "support.status.open",
  [TICKET_STATUS.IN_PROGRESS]: "support.status.in_progress",
  [TICKET_STATUS.WAITING_FOR_USER]: "support.status.waiting_for_user",
  [TICKET_STATUS.WAITING_FOR_SUPPORT]: "support.status.waiting_for_support",
  [TICKET_STATUS.RESOLVED]: "support.status.resolved",
  [TICKET_STATUS.CLOSED]: "support.status.closed",
};

export const PRIORITY_I18N: Record<string, string> = {
  [TICKET_PRIORITY.LOW]: "support.priority.low",
  [TICKET_PRIORITY.NORMAL]: "support.priority.normal",
  [TICKET_PRIORITY.HIGH]: "support.priority.high",
  [TICKET_PRIORITY.URGENT]: "support.priority.urgent",
};

export const CATEGORY_I18N: Record<string, string> = {
  [TICKET_CATEGORY.TECHNICAL]: "support.category.technical",
  [TICKET_CATEGORY.PAYMENT]: "support.category.payment",
  [TICKET_CATEGORY.ACCOUNT]: "support.category.account",
  [TICKET_CATEGORY.LESSON]: "support.category.lesson",
  [TICKET_CATEGORY.COURSE]: "support.category.course",
  [TICKET_CATEGORY.TUTOR]: "support.category.tutor",
  [TICKET_CATEGORY.STUDENT]: "support.category.student",
  [TICKET_CATEGORY.BUG]: "support.category.bug",
  [TICKET_CATEGORY.OTHER]: "support.category.other",
};

export const OPEN_STATUSES: readonly string[] = [
  TICKET_STATUS.OPEN,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.WAITING_FOR_USER,
  TICKET_STATUS.WAITING_FOR_SUPPORT,
];
export const CLOSED_STATUSES: readonly string[] = [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED];
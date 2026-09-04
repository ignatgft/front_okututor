export const TICKET_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_USER: "WAITING_FOR_USER",
  WAITING_FOR_SUPPORT: "WAITING_FOR_SUPPORT",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

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

export type TicketCategory = (typeof TICKET_CATEGORY)[keyof typeof TICKET_CATEGORY];

export const MESSAGE_TYPE = {
  USER_VISIBLE: "USER_VISIBLE",
  INTERNAL_NOTE: "INTERNAL_NOTE",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export const MESSAGE_CLIENT_STATUS = {
  SENDING: "SENDING",
  SENT: "SENT",
  FAILED: "FAILED",
} as const;

export type MessageClientStatus = (typeof MESSAGE_CLIENT_STATUS)[keyof typeof MESSAGE_CLIENT_STATUS];

export const STATUS_LABELS: readonly TicketStatus[] = Object.values(TICKET_STATUS);
export const PRIORITY_LABELS: readonly TicketPriority[] = Object.values(TICKET_PRIORITY);
export const CATEGORY_LABELS: readonly TicketCategory[] = Object.values(TICKET_CATEGORY);

export const STATUS_I18N: Record<TicketStatus, string> = {
  [TICKET_STATUS.OPEN]: "support.status.open",
  [TICKET_STATUS.IN_PROGRESS]: "support.status.in_progress",
  [TICKET_STATUS.WAITING_FOR_USER]: "support.status.waiting_for_user",
  [TICKET_STATUS.WAITING_FOR_SUPPORT]: "support.status.waiting_for_support",
  [TICKET_STATUS.RESOLVED]: "support.status.resolved",
  [TICKET_STATUS.CLOSED]: "support.status.closed",
};

export const PRIORITY_I18N: Record<TicketPriority, string> = {
  [TICKET_PRIORITY.LOW]: "support.priority.low",
  [TICKET_PRIORITY.NORMAL]: "support.priority.normal",
  [TICKET_PRIORITY.HIGH]: "support.priority.high",
  [TICKET_PRIORITY.URGENT]: "support.priority.urgent",
};

export const CATEGORY_I18N: Record<TicketCategory, string> = {
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

export const OPEN_STATUSES: readonly TicketStatus[] = [
  TICKET_STATUS.OPEN,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.WAITING_FOR_USER,
  TICKET_STATUS.WAITING_FOR_SUPPORT,
];
export const CLOSED_STATUSES: readonly TicketStatus[] = [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED];

// Type guards with unknown
export const isTicketStatus = (value: unknown): value is TicketStatus =>
  typeof value === "string" && (STATUS_LABELS as readonly string[]).includes(value);

export const isTicketPriority = (value: unknown): value is TicketPriority =>
  typeof value === "string" && (PRIORITY_LABELS as readonly string[]).includes(value);

export const isTicketCategory = (value: unknown): value is TicketCategory =>
  typeof value === "string" && (CATEGORY_LABELS as readonly string[]).includes(value);

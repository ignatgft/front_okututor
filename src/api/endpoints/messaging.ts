export const messages = {
  conversations: "/api/v1/messages/conversations",
  conversation: (id: string | number): string => `/api/v1/messages/conversations/${id}`,
  send: "/api/v1/messages",
  attachments: "/api/v1/messages/attachments",
  reaction: (messageId: string | number): string => `/api/v1/messages/${messageId}/reactions`,
  reactions: (messageId: string | number): string => `/api/v1/messages/${messageId}/reactions`,
  reply: (messageId: string | number): string => `/api/v1/messages/${messageId}/reply`,
  edit: (messageId: string | number): string => `/api/v1/messages/${messageId}`,
  delete: (messageId: string | number): string => `/api/v1/messages/${messageId}`,
  forward: (messageId: string | number): string => `/api/v1/messages/${messageId}/forward`,
  markRead: (conversationId: string | number): string => `/api/v1/messages/conversations/${conversationId}/read`,
} as const;

export const meetings = {
  token: (bookingId: string | number): string => `/api/v1/bookings/${bookingId}/meeting/token`,
  end: (bookingId: string | number): string => `/api/v1/bookings/${bookingId}/meeting/end`,
} as const;

export const notifications = {
  list: "/api/v1/notifications",
  unreadCount: "/api/v1/notifications/unread-count",
  markRead: (id: string | number): string => `/api/v1/notifications/${id}/read`,
  markAllRead: "/api/v1/notifications/read-all",
} as const;

export const support = {
  tickets: "/api/v1/support/tickets",
  ticket: (id: string | number): string => `/api/v1/support/tickets/${id}`,
  messages: (id: string | number): string => `/api/v1/support/tickets/${id}/messages`,
  send: (id: string | number): string => `/api/v1/support/tickets/${id}/messages`,
  markRead: (id: string | number): string => `/api/v1/support/tickets/${id}/read`,
  close: (id: string | number): string => `/api/v1/support/tickets/${id}/close`,
  reopen: (id: string | number): string => `/api/v1/support/tickets/${id}/reopen`,
} as const;

export const adminSupport = {
  tickets: "/api/v1/admin/support/tickets",
  ticket: (id: string | number): string => `/api/v1/admin/support/tickets/${id}`,
  assign: (id: string | number): string => `/api/v1/admin/support/tickets/${id}/assign`,
  take: (id: string | number): string => `/api/v1/admin/support/tickets/${id}/take`,
  status: (id: string | number): string => `/api/v1/admin/support/tickets/${id}/status`,
  priority: (id: string | number): string => `/api/v1/admin/support/tickets/${id}/priority`,
  agents: "/api/v1/admin/support/agents",
} as const;

export const admin = {
  users: "/api/v1/admin/users",
  block: (id: string | number): string => `/api/v1/admin/users/${id}/block`,
  unblock: (id: string | number): string => `/api/v1/admin/users/${id}/unblock`,
  role: (id: string | number): string => `/api/v1/admin/users/${id}/role`,
  verify: (id: string | number): string => `/api/v1/admin/users/${id}/verify`,
  stats: "/api/v1/admin/stats",
  tutors: "/api/v1/admin/tutors",
  approveTutor: (id: string | number): string => `/api/v1/admin/tutors/${id}/approve`,
  rejectTutor: (id: string | number): string => `/api/v1/admin/tutors/${id}/reject`,
  courses: "/api/v1/admin/courses",
  approveCourse: (id: string | number): string => `/api/v1/admin/courses/${id}/approve`,
  rejectCourse: (id: string | number): string => `/api/v1/admin/courses/${id}/reject`,
  reviews: "/api/v1/admin/reviews",
  hideReview: (id: string | number): string => `/api/v1/admin/reviews/${id}/hide`,
  restoreReview: (id: string | number): string => `/api/v1/admin/reviews/${id}/restore`,
  reports: "/api/v1/admin/reports",
  updateReport: (id: string | number): string => `/api/v1/admin/reports/${id}`,
} as const;
